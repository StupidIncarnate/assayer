# Implementation Status — Conditional Vertical (Phase 1)

> Living status/handoff doc. Source-of-truth design still lives in `requirements.md` /
> `features.md` / `expectation-catalog.md` / `case-studies.md`; this tracks what is BUILT
> against that design and what is next. Last updated: session 3 (2026-07-14) — the analyzer was
> **re-architected onto a recursive scope walk**; see "Session 3" below, which supersedes the
> analyzer internals described under Session 1/2 (the derived facts and downstream layers survive
> unchanged; the traversal does not).

## Headline

**The conditional/derivation vertical is built and ward-green** (all 5 packages:
lint 572 / typecheck 576 / unit 188 / integration 12 / e2e 6 tests). It runs end to end:
`assayer` compile → cache blob carrying analysis → desktop bridge → app detail view. Session 1
narrowed scope to **one syntax family (`if` + returns)** to shake out the whole machine; session 2
widened the analyzer to **literal-union/enum operand types, exhaustive per-member case fan-out,
`switch` statements, and arrow-const/default-export entries** — all still derive + display. Phase 2
(actually executing the derived cases through Jest) is **deferred** — this vertical is derive +
display only.

Worked example (real `smoke-repo/packages/shared/src/format-greeting.ts`):
```
formatGreeting(name: string) → string       · 2 exits → 2 cases
  ├ return@if-then (L3)   guarded by name.length === 0 → then   arrange name=""   (case #1)
  └ return@if-else (L6)   guarded by … → else                   arrange name="a"  (case #2)
enrichment: L1 name: string ; L2 name: string  range { "", "a" }
```

## What a user sees (app detail view)

- **Code pane** (CodeMirror) with a **gutter count** per line = how many generated cases run
  through it.
- **Right tabbed panel**: *Enrichment* (per-line `symbol: type → { range }`) and *Tests*
  (per entry, the generated cases: `formatGreeting("") → reaches L3`).
- **Hover a code line → the cases that run through it highlight** (blue) and the rest dim, in
  both tabs. A case "touches" a line if it's the case's exit line or one of its guard-branch
  lines. Code viewer is memoized so hover never re-creates the editor.

## Architecture — where things live (all new unless noted)

Data flows **core (analyze) → shared contracts → cache blob → desktop resolve → app view →
widgets**. Only the ts-morph adapter touches ts-morph; everything downstream is pure.

- **shared contracts** (`packages/shared/src/contracts/…`, registered in `packages/shared/contracts.ts`):
  `type-descriptor` (recursive discriminated union, serializable), `predicate`, `guard-step`,
  `branch-node`, `exit-node`, `param-descriptor`, `entry-signature` (carries the fn's `line`),
  `representative-value` (branded string|number|boolean union), `derived-test-case`,
  `coverage-id`, `symbol-name`, `type-text`, `line-enrichment`, `function-analysis`,
  `file-analysis`. **Extended:** `compiled-file-blob` + `compiled-file-view` gained an optional
  `analysis: fileAnalysisContract`.
- **core contracts** (`packages/core/src/contracts/…`): `analysis-extract-result`
  (success/error wrapper), `extracted-function`, `arm-values`.
- **core transformers** (pure, `packages/core/src/transformers/…`): `representative-value`,
  `type-to-range` (predicate + type → satisfying/violating value sets), `coverage-id`,
  `type-text`, `derive-cases` (exits × guard paths × ranges → salient cases).
- **core adapter**: `adapters/ts-morph/extract-analysis` — parses exported functions into
  entries/branches/exits with guard paths + type descriptors.
- **core broker**: `brokers/analyze/file/analyze-file-broker` — adapter + transformers →
  `FileAnalysis`. Wired into `brokers/compile/process-file/compile-process-file-broker`
  (persists `analysis` on every blob).
- **desktop**: `brokers/compiled-file/resolve/compiled-file-resolve-broker` threads
  `blob.analysis` into the view (serializes whole over IPC — no new channel).
- **app**: `widgets/detail-panel` (tabs + hover highlight), `adapters/codemirror/view`
  (gutter markers + `onLineHover`), `widgets/code-viewer` (memoized, emits hover),
  `widgets/surface-explorer` (owns `hoveredLine`), `transformers/case-touched-lines`
  (shared "which lines a case touches" — used by gutter AND hover so they can't drift).

## Coverage-ID scheme (settled here)

Cache-internal IDs key on **scope path + condition/discriminant + arm, never line numbers**:
`formatGreeting/if:name.length === 0`, `formatGreeting/return@if-then`, `run/exit@implicit`.
Lines resolve at render time from the node's separately-stored span. This is the coverage-ID
blocker resolved on the simplest case.

## How it's verified

- Unit tests at every layer (adapter drives the two fixtures; transformers golden; broker +
  process-file persistence; desktop passthrough; widgets incl. hover `data-match`).
- **Live**: ran `analyze-file-broker` on the real `format-greeting.ts` → exact target output.
- **End-to-end**: ran the CLI compile headlessly (`npx tsx packages/cli/bin/assayer.ts status`)
  against smoke-repo → on-disk blob `2526a28e…json` now carries the analysis. Cache is
  populated, so `npm run dev` shows the populated detail view. (GUI not launched here.)

## Dungeonmaster lint constraints learned (READ before writing code — these WILL block edits)

The pre-edit-lint hook blocks writes on violations; these cost the most iterations:
- **Brand every primitive that isn't a function input.** `z.string()/z.number()/z.boolean()`
  must chain `.brand<…>()` (even inside a union — brand the whole union). Raw `string`/`number`
  in a **TS type alias, interface field, class field, or generic** (`Map<string, …>`) is
  banned. **Exception:** raw primitives ARE allowed in **function/adapter input params** and
  **callback param types** (`onLineHover?: (line: number) => void` is fine; `hoveredLine: number`
  as a prop is not → use `LineNumber`).
- **No non-exported / nested functions.** `const helper = () => …` inside a file is banned.
  Inline callbacks passed to `.map/.filter/.flatMap`/`domEventHandlers` are fine; recursion =
  the exported function calling itself. Recursive type-descriptor building was inlined / kept
  to one union level because of this.
- **Exhaustive `switch` needs BOTH all union cases AND a `default`** (`switch-exhaustiveness-check`
  + `default-case` + `consistent-return` together). Fold nothing into default to satisfy
  exhaustiveness, but still add a `default`.
- **`max-nested-callbacks` = 4** → extract deep chains to a transformer (that's why
  `case-touched-lines` exists).
- Proxies: a broker/widget proxy must instantiate the proxies of the brokers/adapters it
  imports (`enforce-proxy-child-creation`). A `.tsx` widget needs a `.proxy.tsx` (not `.ts`).
- Tests can't import contract TYPES — build test data via `*Stub`s. Branded values can't be
  written as raw literals in tests → use the stub (e.g. `TypeDescriptorStub({kind:'literal', value:5})`).
- `toMatch` needs `^…$` anchors; `toThrow` uses a regex; `.length`-less strict assertions.
- Array destructuring IS `T | undefined` under `noUncheckedIndexedAccess`.
- `String(x)`/`Number(x)` on an already-typed value trips `no-unnecessary-type-conversion`.

## Session 2 (2026-07-12) — increments landed

All committed, ward-green, and verified end-to-end (CLI compile → cache blob → app e2e). New
smoke-repo fixture `packages/shared/src/route-label.ts` (a `switch` over `'get'|'post'|'delete'`)
is the live worked example; the app e2e drives it and asserts the 3 exhaustive cases in the UI.

- **[done] Union/enum type descriptors (was item 1).** The adapter now maps literal-union and
  enum operand types (params + return) to `{kind:'union', members:[…]}` instead of `unknown`.
  Downstream already consumed unions (type-to-range's eq/neq `unionOthers`, type-text, rep-value).
- **[done] Exhaustive per-member case fan-out (item 1).** `derive-cases` now emits, per exit, the
  cartesian product of each guarding arm's value SET bound to its operand (grouped by operand,
  **intersected** for same-operand constraints, cartesian across distinct operands). A string
  length check → 1 case/exit; an enum's `else` (violating = every other member) → one case per
  member. This is the tier-2 exhaustive behavior.
- **[done] `switch` statements (item 1).** An isolated switch pass desugars each `case` into a
  `'switch'`-kind eq-branch and emits per-case exits (matched arm) + a default exit (else of every
  case). With the intersection above, the default binds to the single UNCOVERED member. Verified:
  `routeLabel` → get→"get", post→"post", default→"delete". Proven `if` logic untouched.
- **[done] Arrow-const + default-export entries (item 3).** Entry enumeration widened past
  `export function` to exported arrow/function-expression consts and `export default` functions/
  arrows; "belongs to this entry" checks generalized to nearest-enclosing-function-like; concise
  arrows get one `return@top` exit.
- **[done] Gutter-count unit test + detail-panel e2e (item 5).** Extracted the gutter aggregation
  into a pure `case-gutter-markers` transformer (+ branded contract) with a golden unit test
  (CodeMirror's custom gutter is jsdom-flaky, so the COUNT logic is now covered off-DOM). New app
  e2e drives the detail view (test-case rows, gutter counts, hover `data-match`, enrichment tab).
- **[deferred, documented] Perf single-parse (item 6).** `process-file` still parses twice
  (extract-map + extract-analysis). A clean merge would collapse two single-responsibility ts-morph
  adapters (map = explorer type-graph; analysis = test derivation) into one pass — a cohesion cost
  the plan itself flags ("fine for now, mergeable later"). Correct next step: a shared parse-cache
  seam (one `Project`/`SourceFile` produced once, both extractors read it) rather than merging the
  adapters. Not worth the regression risk on a green tree for small-file parsing.

## Session 3 (2026-07-14) — the analyzer is a recursive scope WALK

The old analyzer had no walk. It ran a flat `getDescendantsOfKind` scan per SyntaxKind and then
re-derived ownership by climbing ancestors (`getFirstAncestor(isFunctionLike) === entryNode`, three
times). Context flowed UP from leaves instead of DOWN through descent, and four things followed:
constructs could not compose, each host scope needed its own near-copy of the derivation, nesting
did not exist, and unhandled syntax vanished silently. `adapters/ts-morph/extract-analysis` and
`extract-map` are **deleted**; `adapters/ts-morph/walk-file` replaces both.

**The model — two axes carried down one walk** (`contracts/walk-context`):

| Axis | Pushed by | Crossing a function boundary |
| --- | --- | --- |
| `scopePath` | module root, function-like, class | **extends** (`['*module*','Classifier','classify']`) |
| `guardPath` | `if`, `switch` | **resets** — a fn defined in an arm is not guarded by it |
| `tail` | statement position | only the LAST statement can end the scope |

`tail` is what makes a bare top-level `if` and an `if` inside a function the same handler: when the
`if` is the last thing that runs, each arm's COMPLETION is an exit worth a case; when code follows
it, the arms merely converge. Without it, "per-arm exits" would be a rung-specific rule — exactly
the duplication this removes.

**Two reachability predicates, deliberately separate** (`read-terminal` vs `read-accounted`).
"Does this ALWAYS exit?" (does it guard what follows) and "are its ways out already emitted?" (does
the scope owe a completion exit) are different questions, and one predicate answering both is a real
soundness bug: an `if`-with-else whose arms fall through is *accounted for* (each arm gets a
completion) but does NOT *always exit* — code after it runs on both arms. Conflating them guarded a
trailing `return` by an arm it did not depend on, keying a genuinely unconditional exit under a
wrong ID. Specimen: `composition/fallthrough-in-if`.

`walk-node` owns the recursion and calls ITSELF per descent; `dispatch-node` is the only file that
names SyntaxKinds; handlers return `{facts, descents}` and never recurse (R15: core owns traversal).
Scopes are completed on the way back UP — branches/exits travel as LOOSE facts and are claimed by
whichever node opened the scope, so no node ever asks "which function am I in?".

**Bugs the architecture fixed (each now a specimen in `smoke-repo/.../composition/`):**
- `switch` inside `if` silently **lost the outer if guard** (switch exits hardcoded a 1-step guard).
- A `return` inside a callback was attributed to the **enclosing entry** (switch scans skipped the
  ownership filter every other scan applied).
- Two sibling `if`s each returning from `then` produced **byte-identical exit IDs** — and the
  ref-to-ref diff keys on exactly those (churn-matrix #10). Exit IDs now name the BRANCH crossed.
- The early-return rule (`return` after a guard clause is guarded by its `else`) only worked at a
  function's TOP level; nested blocks lost it. `handle-block` applies it at every depth.

**Rungs are now free.** `derive-module-scope` (a 155-line near-copy) is gone; the two `in-class`
ratchets FLIPPED from `functions: []` to real analysis; nested functions and callbacks are walked
(they were double-dropped). `guards/is-function-like-kind` is deleted — it existed only for the
ownership re-derivation the walk makes unnecessary.

**Dark spots (D22) are real.** `dispatch-node`'s default branch descends anyway (contents are never
lost — a `return` inside an unhandled `for` is still found) and records load-bearing-but-unclaimed
kinds (`statics/significant-syntax-kinds`), which project to `FileAnalysis.darkSpots` and ride into
the cache blob. `darkSpots` is REQUIRED on `file-analysis`: an analysis that can omit its own blind
spots reads as complete.

**Single parse.** `walk-file` emits one normalized model; `analysis-projection` and `map-projection`
are pure functions of it. The deferred double-parse debt (old item 6) is resolved as a byproduct.

**IDs changed (cache-internal by ruling, so free):** every ID is rooted at `*module*`; exits key on
guard-path branch identity (`return@if:<projection>#then`); `project-node` walks with `forEachChild`
rather than `getDescendants`, which dropped punctuation and **fixed a real formatting sensitivity**
(`(n) => n` vs `n => n` used to key differently). Verified: byte-identical across runs, and a
formatting-only edit (minify, quote style, spacing) moves NO ID.

**Known caveats, deliberately not silently resolved:** `read-operand-type` keeps BOTH existing rules
behind one owner (param → declared descriptor; other binding → widened type-graph read) — merging
them would collapse `'get'|'post'|'delete'` to `string` and destroy the exhaustive fan-out. Operands
still resolve by NAME, not symbol → a local shadowing a param reads as the param. A nested helper's
branches are walked but not projected as an entry (its logic is owed through its caller — needs the
call-graph vertical).

## What's next (prioritized)

1. **Ternary branches.** Now a single new handler file plus its case-derivation semantics, touching
   no existing handler — the ternary is already a recorded DARK SPOT, so the gap is visible rather
   than silent, and `read-condition` already takes a condition expression so it reuses unchanged.
   Same shape for `try/catch`, loops, `??`, `?.`, async.
2. **Non-literal switch cases.** `case Color.Red:` (enum-member refs / identifiers) and fallthrough
   cases are skipped today — only string/number literal cases desugar. Resolve enum-member refs to
   their literal value via the type checker to cover the idiomatic enum switch.
3. **Cross-function / inter-procedural flow (was item 2).** Each `FunctionAnalysis` is independent
   and coverage-id-keyed; a call-graph pass can stitch a caller to the callees it invokes without
   touching this layer. This is a genuinely NEW capability (cross-file resolution + a call-graph
   artifact), not an extension — size it as its own vertical.
4. **Phase 2 — execute + report.** Wrap Jest to actually run the derived cases, map pass/fail back
   onto exits via a reporter, show green/red per case in the Tests tab. Larger; pulls in the runner.
   (Explicitly deferred by owner.)
5. **UX polish (open question):** hover **highlights + dims**; owner floated "show ONLY those
   cases" (filter) as an alternative — one render change if wanted.

## Guardrails carried from the design

- P4 holds: arrange values come from the input domain; a case asserts the **exit is reached**,
  never the returned value. No authored "answers" artifact.
- Determinism holds: representative values are fixed (not random); coverage IDs carry no lines.
- The cache (`.assayer/cache/`) is disposable/gitignored; clear it to force re-analysis
  (blobs are reused by content hash, so a stale blob won't re-run the analyzer).

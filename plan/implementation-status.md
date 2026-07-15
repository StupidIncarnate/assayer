# Implementation Status — Conditional Vertical (Phase 1)

> Living status/handoff doc. Source-of-truth design still lives in `requirements.md` /
> `features.md` / `expectation-catalog.md` / `case-studies.md`; this tracks what is BUILT
> against that design and what is next. Last updated: session 4 (2026-07-14) — a branch's condition is
> now a boolean TREE and cases fan out per CAUSE; see "Session 4" below, which supersedes the flat
> operand+predicate branch shape described under Session 1/2. Session 3's recursive scope walk stands
> unchanged — the tree slots into it via one handler call.

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

## Local setup

`@dungeonmaster/*` are `file:` deps, so **`codex-of-consentient-craft` must be checked out as a
sibling directory** of this repo. npm installs them as symlinks; edits there are live here.

## Packaging — NOT publish-ready (deferred: not publishing yet)

`npm pack --dry-run` on `packages/core` reports **359 files, `dist/` → 0 of them**, while that
package.json's `exports` point at `./dist/adapters.js` / `./dist/brokers.js`. `dist/` is gitignored
and there is no `files` field or prepublish build, so a published core would resolve every export
to a file that is not in the tarball — broken on arrival. It also ships 127 `.test.ts` files and
`CLAUDE.md`. Fix before any publish: add a `files` allowlist + a prepublish build.

**Open packaging question (undecided):** core declares `typescript` and `ts-jest` as hard
`dependencies`. For a package installed into arbitrary consumer TS repos, `typescript` is
conventionally a `peerDependency` — otherwise the consumer gets a second TypeScript copy their own
`tsc` and our ts-morph can disagree about. Decide before publishing.

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

## Session 4 (2026-07-14) — conditions are a boolean TREE

Prerequisite for the execution vertical (owner: "when an `if` has more than one argument, we can track
it falling into that `if` — traditional coverages don't do that"). It was not a runner gap: the
analyzer could not REPRESENT a compound condition. `read-condition` classifies exactly one comparison,
so `score > 5 && bonus > 1` read as ONE opaque operand with an `unrecognized` predicate.

**That was silently unsound, not merely incomplete.** Both arms derived IDENTICAL arrange values —
`grade(0, 0)` was emitted as *both* the then-case and the else-case, so one of the two provably could
not reach the exit it claimed. `darkSpots` was empty. Every `&&`, `||`, `!` and bare-boolean condition
in any analyzed repo had this.

- **`condition-leaf` + `condition-node` contracts** (shared): a recursive tree of `and`/`or`/`not` over
  leaves. `branch-node` REPLACES `operandParamName`/`operandType`/`predicate` with `condition` — one
  encoding, since a simple comparison is a one-leaf tree. Leaf ids are the branch id plus a positional
  path (`#leaf`, `#leaf.0`, `#leaf.1.0`); parens do NOT consume a path segment.
- **`read-condition-tree-layer-adapter`**: recursive decomposition, typing each leaf.
  `handle-if` collapsed to one call; `handle-switch`'s eq-branches are one-leaf trees.
  `read-condition`/`transformers/predicate` keep their jobs — this adds only SHAPE.
- **Truthiness is now classified** (`predicate-transformer`): a condition with no operator is a
  `truthy` test, not `unrecognized`. `truthy`/`falsy` already existed in the contract and in
  `type-to-range`; **nothing had ever produced them** — dead code. Without this, `!ready` and
  `a || flag` derive no values.
- **Cause enumeration** (`condition-causes` → `exit-causes` → `cause-arrange`, orchestrated by
  `derive-cases`): one case per distinct REASON an arm was taken. Short-circuiting is MODELLED — a leaf
  the language would not evaluate is ABSENT from the cause (absent ≠ false), which is the distinction
  branch coverage throws away. **`type-to-range` needed no change**: `!` just flips which side of
  `{satisfying, violating}` is read.
- **Enumeration is LINEAR, not exponential** — `a && b && c` is false for 3 causes, true for 1 (MC/DC's
  n+1). Pinned by a test; `mixed.ts` gets 4 cases from 3 leaves. If this ever goes exponential,
  exhaustive derivation stops being affordable.
- **Enrichment is now per-LEAF**, so a compound condition enriches BOTH operands. It previously
  enriched neither, having no single operand to name.
- **Specimens**: `boolean/{and,or,not,mixed}.ts`. No separate `short-circuit` specimen — short-circuiting
  is a consequence of `&&`/`||`, not a construct, and `and.ts`'s else-cause already exercises it.
- Verified: ward green (lint 718 / typecheck 722 / unit 242 / integration 12 / e2e 1),
  `test:syntax` 15 suites / 38 tests, determinism byte-identical, and formatting immunity holds
  (minified + double quotes + redundant parens ⇒ identical IDs).

**Deferred, deliberately — the dark spot for an UNCLASSIFIED leaf.** The plan put this in this phase;
it is not done. An `unrecognized` leaf (`if (a.b > c)`, `if (a + b)`) still falls back to representative
fill for BOTH arms — i.e. the exact silent unsoundness fixed above still exists for conditions the
classifier cannot read. It is PRE-EXISTING and not worsened here, but it is real. Doing it properly
needs a design call, which is why it was not rushed: `dark-spot` is shaped around a walk NODE (`kind:
SyntaxKindName`, `reason: 'unhandled-syntax'`), and a condition leaf carries no syntax kind — so it
needs either a new reason plus a node-kind on the leaf, or the walk emitting the condition as an
unhandled node. Also still open from before: `read-condition` reads the LEFT side of any binary as the
operand, so `a + b` names `a` (harmless today only because the predicate is `unrecognized`).

## Session 4b (2026-07-14) — the execution vertical RUNS

The runner works end to end against a real specimen. `runUnitBroker` → probe plan → wrapped Jest →
instrumented emit → trace → saved artifact. Live on `boolean/and.ts`: 3/3 cases passed, and the trace
carries exactly what the owner asked for.

```
grade(5, 0)  ONE cond event   leaf.0 false          bonus > 1 NEVER RAN (short-circuit)
grade(6, 1)  TWO cond events  leaf.0 true
                              leaf.1 false          this operand DECIDED
             exit  'fail'                           the end result of the data
```

- **Emit-time injection, proven.** Spike: 7/7, **0 diagnostics**. Narrowing survives (`if (!user)
  return;` then `user.name` compiles — a text splice makes that TS18047). Short-circuit survives.
  `return (a,b)` still returns 2; `obj?.b.c` still returns undefined instead of throwing. `__P` as a
  global via `setupFiles` works across shim + subject. `runCLI` + inline JSON config works.
- **The walk emits PROBE SITES** (`probe-site`, threaded through `walk-facts`/`walk-file-result` flat
  like `nodes`). Load-bearing: the id a probe reports at runtime is the id the analyzer derived, from
  the SAME descent. A second derivation would drift.
- **Offsets live in a cache-internal SIDECAR** (`probe-plan`), keyed by content hash, never in the
  analysis blob and never diffed. Offsets are formatting-coupled by nature; coverage IDs must not be.
  Keying by hash makes a stale read unrepresentable — wrong bytes, no plan to find.
- **`version` is PINNED**; the analyzer content hash rides in ts-jest's transformer `options`, which
  it folds into its cache key. Invalidation by content, never the manual version bump ts-jest's own
  transformers use (the mechanism this repo ruled against; cf. the `/tmp/jest_rt` burn).
- **The probe records value AND `Boolean(value)`.** Uniform, not a special case: a comparison leaf is
  already boolean; a truthiness leaf (`!user`) wraps the raw operand, and Boolean() IS its predicate.
- **Reached exit = last trace event among the ENTRY'S OWN exit ids** (`caseSet.exitIds`). "Last exit
  probe" is wrong — a callback the entry invoked fires its own exit probe afterwards.
- **One execution path.** `runUnitBroker` produces one artifact; CLI and desktop both read it. They
  cannot drift because they are not two runners.

**An entry carries its ACCESS, and that is what makes a case addressable.** A case has arrange values
and a predicted exit, but neither says how to lay hands on the function. `entry-access` answers it:
`named` (a module property), `default` (under `default`), `method` (an INSTANCE, built per case so no
case sees another's state), `constructor` (reached through `new`), `unreachable` (a module scope, a
nested helper — nothing can call it).

The class is the only node that knows its own name and what an instance costs, so it hands both DOWN
(`walk-context.enclosingClass`) — climbing back up for it would rebuild the ownership bug the walk
exists to remove. It resets on entering any other scope, exactly as `guardPath` does: a function
nested inside a method is not a method.

`access` and `exported` are different questions and both are kept: access says HOW an entry is
reached, `exported` says WHETHER it can be. A method of an unexported class is `method` + `exported:
false`.

**What cannot be driven is a NAMED gap, never a failure.** `case-set-projection` splits on capability
rather than on a name: a method whose class needs constructor arguments, and a constructor (reached
through `new`, which the runner does not model), become `gaps` carrying a reason. `gaps` is REQUIRED
on `case-set` for the reason `darkSpots` is — a set that can omit what it could not drive reads as
complete coverage. Driving them anyway is what reported CORRECT code as failing: a method resolved as
`subject[name]` is `undefined`, and a constructor resolved that way is the class, which throws when
applied without `new`.

- Verified: ward green (lint 786 / typecheck 788 / unit 265 / integration 12 / e2e 1), `test:syntax`
  15/38, and live — `if-else/in-class.ts` runs 2/2 with per-arm exit attribution.

**Known gaps, named not hidden:** switch case-leaves get NO cond probe: `method === 'get'` is
desugared and has no expression to wrap, so switches run and report but lack per-case attribution
(probing the discriminant would recover it). The unclassified-leaf dark spot is still open, and it
bites any condition over non-literals: `value > this.floor` derives the SAME arrange for both arms, so
one case provably cannot reach the exit it claims and fails against correct code. Instance state and
constructor arguments are both untyped as inputs — the "global inputs" problem, adjacent to the call
graph.

## What's next (prioritized)

0. **Phase 4/5 of the execution vertical — CLI + UI.** The engine is done and proven; what remains is
   surfacing. `assayer unit [paths]` needs a real arg parser — `cli-command-normalize` is a
   single-token switch over a closed enum with no flags, and it must use Node's built-in
   `util.parseArgs` (a third-party parser is a new dep). Then `assayer detail <runId>` and the link
   into the app; the bridge (a spawn adapter that CAPTURES exit code — the existing one is
   `detached`+`stdio:'ignore'` and cannot await); and the Tests tab: stub list, Run action, saved
   status, trace view. **Surface `caseSet.gaps` wherever results are shown** — a gap is the product
   telling a human what it could not drive, and it is worthless if only the JSON knows.
   Plan: `~/.claude/plans/rippling-knitting-lollipop.md`.

0b. **The engine has NO automated end-to-end coverage.** `run-unit-broker.test.ts` is fully mocked
   (the proxy hands back a stub run; Jest never executes), and core has ZERO integration tests — ward's
   "integration 12" is desktop/cli/app only. So the headline capability can regress silently, and
   every claim that it runs rests on a hand-run probe. The plan already specifies the fix:
   `analyzeFileBroker` → assemble → `runCLI` against smoke-repo, asserting `run.json` + traces on
   disk. Do this BEFORE the CLI/UI work rides on top of it.

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

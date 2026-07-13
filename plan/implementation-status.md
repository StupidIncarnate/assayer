# Implementation Status — Conditional Vertical (Phase 1)

> Living status/handoff doc. Source-of-truth design still lives in `requirements.md` /
> `features.md` / `expectation-catalog.md` / `case-studies.md`; this tracks what is BUILT
> against that design and what is next. Last updated: session ending 2026-07-12.

## Headline

**The full "conditional + return" vertical is built and ward-green** (all 5 packages:
lint 567 / typecheck 571 / unit 186). It runs end to end: `assayer` compile → cache blob
carrying analysis → desktop bridge → app detail view. Scope was deliberately narrowed to
**one syntax family (`if` conditionals + returns)** to shake out the whole machine before
adding more syntax (owner's "full system on just conditionals first" directive). Phase 2
(actually executing the derived cases through Jest) is **deferred** — Phase 1 is derive +
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

## What's next (prioritized)

1. **More predicate/type coverage in the adapter.** The transformers already handle unions
   (enum members), numeric thresholds, truthy/falsy — the **adapter currently punts unions to
   `unknown` and only parses `if`**. Emit union type descriptors (enum params) and handle
   `switch` + ternary branches. This is the natural next increment and mostly extends the
   adapter's inline predicate/type logic.
2. **Cross-function / inter-procedural flow.** `run()` is one implicit exit; the analysis does
   not descend into `formatGreeting` it calls. Each `FunctionAnalysis` is independent and
   coverage-id-keyed, so a call-graph pass can stitch them without touching this layer.
3. **Exported arrow-consts / default exports** as entries (v1 only handles `export function`
   declarations; the seam is the `getFunctions().filter(isExported)` step).
4. **Phase 2 — execute + report.** Wrap Jest to actually run the derived cases, map pass/fail
   back onto exits via a reporter, show green/red per case in the Tests tab. Larger; pulls in
   the runner. (Explicitly deferred by owner in Phase 1.)
5. **UX polish (open question):** hover currently **highlights + dims**; owner floated
   "show ONLY those cases" (filter) as an alternative — one render change if wanted. Also the
   gutter count rendering has no dedicated unit test (CodeMirror/jsdom flakiness) — visually
   verified only.
6. **Perf later:** `process-file` now parses each file twice (extract-map + extract-analysis);
   fine for now, mergeable later.

## Guardrails carried from the design

- P4 holds: arrange values come from the input domain; a case asserts the **exit is reached**,
  never the returned value. No authored "answers" artifact.
- Determinism holds: representative values are fixed (not random); coverage IDs carry no lines.
- The cache (`.assayer/cache/`) is disposable/gitignored; clear it to force re-analysis
  (blobs are reused by content hash, so a stale blob won't re-run the analyzer).

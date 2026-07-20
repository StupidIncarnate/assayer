# Cross-file constraint composition & the stub cache — build plan

Design source of truth for the constraint/stub work. Plain-language model up top;
grounded integration seams (file:line) per rung below. Present-tense: this
describes the target and the sequence to reach it.

## Why — the two specimens that bracket the work

- `happy-path/composition/nested-function` **works**: `inner` is a private driven
  through `outer` because the call and its argument live in one file, so `inner`'s
  `n > 5` is arranged through `outer`'s `value`.
- `sad-path/unreachable/cross-file-guards` is **broken**: `upload(size)` guarded by
  two imported predicates (`exceedsLimit` = `> 50`, `withinBudget` = `> 100`)
  generates three cases that all arrange `size = 0`; two fail against correct code,
  the dead `'priority'` branch is not caught, and nothing is admitted. It is the
  cross-file twin of the nested-function case.

Root causes, both confirmed:

1. A call inside an `if` condition records no call reference, so there is no edge to
   follow. `handle-if-layer-adapter.ts` returns only its arm descents (`:117-120`)
   and hands the condition only to `read-condition-tree-layer-adapter` (`:45-50`),
   which returns no descents and no `calls`. The `CallExpression` is never routed to
   `handle-call`, so `module-graph-projection-transformer.ts:27-40` builds an empty
   `references` list while the import edges remain. (Asserted in
   `cross-file-guards.test.ts:42-51`.)
2. The imported callee's return types as `any` in the hermetic walk
   (`read-operand-type-layer-adapter.ts:38-44`, per core CLAUDE.md §5.10), so the
   guard reads as an opaque `truthy` leaf (`read-condition-tree-layer-adapter.ts:115-134`
   → `predicate-transformer.ts:36-38`). The real predicate lives in the child and
   never reaches the caller.

## The model — plain

**Per file, on read — each file records only its own rules.** For every function,
the walk already records, per input, the checks applied to it toward each exit
(`> 50`, non-empty, …) as branch leaves carrying `{ operandParamName, operandType,
predicate }`, plus where each input flows out — the `CallSite`s with `param-ref`
args naming which caller parameter is passed into which callee slot. All of this is
the file's content-keyed blob. A file stores its own predicates plus these links —
never a child's predicates.

**At case-build time — walk down from the entry and combine.** Follow each input as
it flows into the functions it calls, pull those callees' predicates, stack every
rule that lands on a value, then for that value: pick one that satisfies all rules,
or report the branch dead if they contradict, or admit honestly if a rule can't be
read. Combining is per-value: two inputs stay independent — one may pick up a
child's rule while the other is a free fill.

Out of that same step, for free: the test inputs, the dead-branch build errors, and
the minimal set of downstream pieces a case actually leans on (the "stubs").

## What already exists (reuse, do not rebuild)

- **Call + arg recording:** `handle-call-layer-adapter.ts` + `call-site-contract.ts`
  (`callee` local/import/unresolved; `args` param-ref/literal/opaque; `guardPath`;
  `position`). `param-ref` is recognized by SYMBOL, not text
  (`read-call-args-layer-adapter.ts:21-26`).
- **Arg→param mapping:** `follow-calls-transformer.ts:57-72` and
  `through-caller-cases-transformer.ts:35-40` (`toCallerParam`).
- **Conjunction + solve + dead-branch, all reusable unchanged:**
  `cause-arrange-transformer.ts:77` intersects domains per operand (the conjunction);
  `:82` runs `is-domain-empty-guard` and returns `unreachable` on a contradiction;
  that propagates to the `unreachable-exit` lint at `analyze-file-broker.ts:73-81`.
  `type-to-range-transformer.ts` turns predicate + operand type into satisfying/
  violating domains; `domain-values-transformer.ts` picks the concrete value last.
- **The cache/stitch pattern is the template:** content-keyed artifacts
  (`external-signature-read-broker.ts` keys on a sha256 of export name + `.d.ts`
  bytes; the resolved index keys on layout + tsconfig hash and is built from finished
  blobs, never a re-parse — `compile-resolve-graph-broker.ts`). The stitch already
  reads a local target's blob to pull its signature
  (`compile-resolve-graph-broker.ts:239-251`); reading its predicate model is the
  same kind of read.

## The build — rungs, each flips a real specimen

### Rung 0 — value-picking cleanup (independent; ship first)

Small, self-contained, and it is the value layer the rest sits on.

- `representative-value-transformer.ts`: number default `0 → 7`, string default
  `"a" → "abc123"` (only the UNCONSTRAINED fills; guard-driven picks like 51, 100,
  `"get"` are untouched — they come from `domain-values`/`type-to-range`).
- Non-empty-string stand-in `"a" → "abc123"` (`type-to-range-transformer.ts` truthy
  string member). Length-bounded strings built from an `"abc123…"` pattern (slice to
  the permitted length) instead of a repeated `"a"` (`domain-values-transformer.ts`
  `FILLER`); the empty string stays `""` where a guard needs falsy.
- Boolean default stays `false`.
- Switch: values derive from the discriminant's type — a union's default binds the
  single uncovered member (already the behaviour; `derive-cases` test at
  `:294-356`, specimen `switch/in-function`), an open type falls back to the
  representative fill. Confirm no literal fallback is baked anywhere.
- New specimen `switch/…/switch-true` (`switch (true) { case cond: … }`): the
  discriminant carries no value to vary, so cases branch on the variables inside each
  case condition — verify it is processed as branches on those variables, not as
  equality against `true`.
- Update specimen assertions + the app e2e fixtures. Green on both `npm run
  test:syntax` and `npm run ward`.

### Rung 1a — record calls sited in conditions

- `handle-if-layer-adapter.ts`: add the condition subtree to the returned descents
  (`:117-120`) with the enclosing, UN-extended `guardPath` (the condition runs before
  either arm is chosen — matching the "empty guardPath when the call always runs"
  CallSite semantics). Handlers still never recurse; the core descends.
- Symmetric fix for the switch discriminant in `handle-switch-layer-adapter.ts`.
- Result: `handle-call` fires for the in-condition call, `module-graph-projection`
  gains the reference, and `cross-file-guards`' "no call references" assertion flips.
  This is step zero — nothing composes without it.

### Rung 1b — same-file predicate compose (no cache)

- New `compose-predicates-transformer` at `analyze-file-broker.ts:45` (alongside
  `follow-calls`, both `walked`-driven), rewriting the parent entry's `branches`
  BEFORE `derive-cases` at `:49`.
- Swap an opaque `truthy` leaf whose operand is a param passed straight into a
  same-file callee for the callee's own predicate leaves, re-based onto the parent's
  param via the existing `toCallerParam` mapping. Restrict to direct `param-ref`
  passthrough — the exact rung `follow-calls` already draws.
- New same-file specimen (a nested `exceedsLimit`-style guard). The existing
  intersect/solve/dead-branch machinery does everything downstream unchanged. Proves
  the compose mechanism with zero cross-file moving parts.

### Rung 1c — cross-file predicate compose (the stub read)

- The child predicate lives in another file's blob, which the per-file broker does
  not hold. So cross-file case derivation for affected parents becomes a STITCH-TIME
  re-projection (in the compile/resolve-graph/run pass), consistent with the two-phase
  model (core CLAUDE.md §9): the per-file blob stays pure with the guard opaque, and
  the stitch composes and re-derives the parent's cases once the edge is resolved.
- v1 reads the child's predicate model straight from its finished blob via the
  resolved edge — no new cache file. A dedicated `cache/stubs/<hash>.json` artifact is
  a later formalization (and what the run-time registry will want).
- Flips `cross-file-guards` to two correct cases (`size = 51` → L6, `size = 0` → L13)
  plus one `unreachable-exit` build error for the dead `'priority'` line. Move the
  specimen from `sad-path/` to `happy-path/` when it flips.
- Admit honestly (dark spot / undriven) when the child predicate cannot be re-based —
  a transformed argument, an opaque child. Never fall back to a fill: that silent
  `size = 0` is the exact sin this rung removes.

## Storage & performance

- Own predicates live in the content-keyed blob → a child edit does not dirty its
  parents, and the same child is reused by every caller.
- The composed cross-file picture is rebuilt at stitch/run time, never persisted →
  the minimal stub set depends on the entry being run, so it is a per-run answer, not
  a per-file fact.
- Per-file derivation is computed once and shared: run-one and run-all read the same
  blobs; a helper used by 40 callers is analyzed once. Only the compose is per-entry,
  and it is cacheable (keyed on the entry plus the set of child predicates it pulled).
  Run-all is the same cache with more readers plus child-before-parent ordering.

## Solver scope (v1)

Interval predicates on a single value (`>`, `<`, `==`, `!=`, `length-*`), with
conjunction + witness + emptiness — all already implemented. No general solver.
Defer: transformed arguments (`child(size * 2)`), value chains through locals
(`const x = child(a); if (x) …`), and expression-level branches (the ternary dark
spot, core CLAUDE.md §8).

## Honest-admission invariant

When a needed guard cannot be read or composed, admit it (dark spot / undriven) — do
not pick a value. The whole wrongness of `cross-file-guards` today is that it fills
`0` and admits nothing, so the analysis reads as complete while understanding neither
guard.

## Open decisions to confirm

1. **Cross-file case derivation as a stitch-time re-projection** (Rung 1c) — the
   biggest architectural call. Confirm this over threading cross-file data into the
   per-file broker.
2. **v1 reads the child predicate from the existing blob** vs. a new `cache/stubs`
   artifact. Recommend blob-read; formalize the artifact only when the run-time
   registry needs it.
3. **Same-file compose (1b) as a distinct rung before cross-file.** Recommend yes — a
   free intermediate that proves the mechanism with no cache.
4. **Solver stays interval-only for v1.** Confirm; generalize only when a specimen
   forces it.
5. **Switch:** no literal hardcode found — union default is the uncovered member.
   Confirm that reading, or point at the exact spot that looked baked-in.

## Where this fits

This is the forward half of layered verification / the stub registry (requirements
R19, D26): a downstream piece's proven predicate feeding the caller that relies on
it. `through-caller` is the same thing one seam in. Run-time stubbing across a real
I/O seam — replacing a downstream with its verified pair so the upstream runs in
isolation — is the next rung, built on this one.

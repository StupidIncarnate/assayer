# Next-session handoff — cross-file constraint / "stub" work

Continuation context for the constraint-composition ("stub") work. Everything
below is **built and green** on both `npm run ward` and `npm run test:syntax`,
but **uncommitted** — it is all in the working tree, nothing has been committed.

Design source of truth: `plan/cross-file-constraints.md`. Read
`packages/core/CLAUDE.md` before touching the analyzer. Verify with **both**
`npm run ward` **and** `npm run test:syntax` (the specimen catalogue is not in
ward's jest graph). The **smoke-repo is the example repo** — see the "Driving the
desktop app by hand" section of the root `CLAUDE.md` for the compile + launch
recipe.

## The mechanism, in one line

Compose a caller's opaque `if (predicate(x))` guard with the callee's real
predicate at **consume time**: the per-file cache blob stays opaque
(content-keyed, child-independent), and composition is rebuilt when the analysis
is served or run — never persisted.

## What was built this session (all green, uncommitted)

- **Value-picker defaults** — unconstrained fills are `7` (number) / `"abc123"`
  (string); length-bounded strings slice an `"abc123…"` pattern. Source of truth:
  `packages/core/src/statics/representative-value/representative-value-statics.ts`
  (used by `representative-value-transformer`, `type-to-range-transformer`
  truthy/falsy string members, `domain-values-transformer`).
- **Rung 1a — calls in conditions** — `if` now descends its condition subtree, so
  a call sited in a guard is recorded
  (`adapters/ts-morph/walk-file/handle-if-layer-adapter.ts`). No-op for call-free
  conditions.
- **Rung 1b — same-file compose** — `scope-record.predicateSignature` (extracted
  in `handle-function-layer-adapter` from a branchless `return <bool-expr>` body,
  gated so every leaf is a real comparison); `condition-leaf.operandCallPosition`
  (stamped in `read-condition-tree` on call operands);
  `transformers/compose-predicates` + `transformers/rebase-predicate-condition`,
  wired in `brokers/analyze/file/analyze-file-broker.ts` before `derive-cases`.
  Specimen: `smoke-repo/…/happy-path/composition/same-file-predicate/`.
- **Rung 1c — cross-file compose** —
  `brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker.ts`,
  a consume-time overlay (**Option B**: resolves + re-walks the sibling on disk to
  read its `predicateSignature`; refuses package/builtin/unresolved). Applied in
  `run-unit-broker`, `test/harnesses/syntax-traits.ts` `analyze()`, and the desktop
  serve broker `brokers/compiled-file/resolve/compiled-file-resolve-broker.ts`
  (display path). Flips `smoke-repo/…/sad-path/unreachable/cross-file-guards/`:
  `upload` gets two sound cases (`size:51 → L6`, `size:50 → L13`) + an
  `unreachable-exit` lint for the dead L10 `'priority'`. It STAYS `sad-path`
  (a lint = unclean run); registry trait gained `lint:unreachable-exit`.
- **Enrichment shared transformer** —
  `transformers/file-enrichment/file-enrichment-transformer.ts`, reused by
  `analyze-file-broker` and the cross-file overlay so composed branch lines get
  their enrichment rows. (Fix for a bug where the overlay passed stale enrichment
  through — cross-file-guards' Enrichment showed only `L4`.)
- **Unit tests backfilled** — `handle-function` predicateSignature + gate,
  `read-condition-tree` operandCallPosition, `type-to-range` truthy/falsy string,
  `analyze-file-broker` compose wiring, `file-enrichment-transformer`.
- **Docs** — root `CLAUDE.md` now names the smoke-repo as the example repo with
  the compile/launch recipe; `plan/cross-file-constraints.md` is the design doc.

## Verified

- **On disk**: the `cross-file-guards` blob under `.assayer/cache/blobs/` is
  fully opaque (`truthy`/`any`, `size:7`, no lint) — composition is serve-time,
  not baked into the content-keyed cache.
- **In the real app (CDP)**, all three detail-panel tabs:
  - Enrichment — `L4 size`, `L5 size → {51,50}`, `L9 size → {101,100}`.
  - Tests — `upload(51) → L6`, `upload(50) → L13`, + the unreachable-exit LINT.
  - Contracts — `exceedsLimit`/`withinBudget` resolved to their `.ts`,
    `size: number → returns boolean`.
  - Controls (`same-file-predicate`, `and`) unchanged — no regression.

## OPEN ITEMS

### 1. IMMEDIATE DECISION — predicate functions get one case, not two

A predicate function like `exceedsLimit(size: number): boolean { return size > 50; }`
currently derives **one** case (fill `size:7`) because it is branchless — one
`return` = one exit — and the `> 50` is extracted only to compose into callers,
not to derive `exceedsLimit`'s own cases. This is consistent with the design
principle that a pure function's value-correctness is verified at its
**consumption** site (`upload` now has the 51/50 cases), not in isolation.

The open question (was mid-discussion, undecided): should a predicate function
derive **two** cases — `size:51` (predicate true) and `size:50` (false) —
treating `return <predicate>` as a two-outcome branch? Implications:
- Both outcomes hit the **same** `return` line, so exit-reachability alone can't
  tell them apart — the interpreter must observe the **returned boolean** to
  distinguish `return@true` from `return@false` (a model extension).
- Expected outcomes come from the declared predicate, so it stays **P4-safe**
  (not a snapshot), but it is a conscious step past "don't value-test pure
  functions in isolation" (D21).
- We already extract the predicate (`predicateSignature`), so it's a focused
  analyzer change.
- Prior lean: **do it** — a predicate function that never tests its true side is
  weak coverage — but it's a design call for the owner.

### 2. Stub provenance in the UI (offered, not built)

The composed guard shows `size > 50` and the Contracts tab shows the resolved
callee, but nothing labels "this `> 50` was **borrowed from** `exceedsLimit`."
Enhancement: record provenance in the overlay + a per-branch annotation in the
detail panel. Not built.

### 3. `switch(true)` — DEFERRED

Not a value cleanup — it's a real handler feature. Used as an if-chain
(`case size>5: … case count<0: …`), later cases are reachable only when earlier
ones are false, so it needs **sequential guard chaining** (case N guarded by all
prior cases false), plus reading each case expression as a condition and
descending the case bodies. Today it silently drops the case predicates + their
exits (0 branches, 1 default exit, no admission) — a soundness gap. Scoped as a
moderate, localized change to `desugar-switch-layer-adapter` +
`handle-switch-layer-adapter` (reuse `read-condition-tree` per case); no new
handler/dispatch route.

### 4. Nothing is committed

All work is in the working tree, green. Commit when ready (branch first if on the
default branch).

## How to re-verify (recipe)

Compile the smoke-repo into a scratch cache, launch the built app, attach over
CDP. (Root `CLAUDE.md` has the canonical version.)

```
# 1. config dir with repoRoot → absolute smoke-repo path
#    { "repoRoot": "<abs>/smoke-repo", "exclude": [], "stableBranch": "master" }
# 2. compile (writes <configDir>/.assayer/cache/)
env -C <configDir> node packages/cli/dist/bin/assayer.js status
# 3. launch (headless window on :1, CDP on 9222)
DISPLAY=:1 npx electron packages/desktop/dist/bin/desktop-main.js \
  --repo <configDir> --remote-debugging-port=9222 &
# 4. attach: chromium.connectOverCDP('http://127.0.0.1:9222'),
#    contexts()[0].pages()[0]; click FILE_TREE_FILE[data-relpath=…], then the tabs.
```

Detail-panel testids: tabs `TAB_ENRICHMENT` / `TAB_TESTS` / `TAB_CONTRACTS`
(`keepMounted={false}` — click each to render); rows `ENRICHMENT_ROW`,
`TEST_CASE_ROW`, `LINT`, `DARK_SPOT`, `UNDRIVEN`, `CONTRACT_ENTRY`. Or read the
data directly: `window.assayerBridge.getCompiledFile({ relPath })` (goes through
the display overlay). Kill the app with `pkill -f '[d]esktop-main.js'`.

Key specimens: `sad-path/unreachable/cross-file-guards/` (cross-file),
`happy-path/composition/same-file-predicate/` (same-file),
`happy-path/boolean/and/` (control).

# The stub repository — design source of truth

Design doc for the stub repository and the full input-bucket case model it rides on.
Present-tense: this describes the target and the model, with grounded integration seams
per area. Requirements references resolve in `requirements.md` (D22/D23, C3, R19/D26);
the analyzer model in `packages/core/CLAUDE.md`.

## The two things a file's inputs mean

A file's logic partitions its inputs into buckets: `if (value > 5)` splits `value` into
`>5` and `≤5`; `switch (mode) { case 'a': … }` splits `mode` into `'a'` and everything else.
Two decoupled artifacts read those partitions with **opposite** policies (D22):

- **The full input-bucket set — what a file TESTS.** Every combination the logic distinguishes,
  its own plus its composed children's, even when several combinations converge to the same exit.
  `exceedsLimit(size){return size>50}` owes `51` AND `50`; a fall-through `if`+`switch` whose arms
  all reach one `return 1` owes all four combinations; `upload` guarded by `>50` then `>100` owes
  `50`/`51`/`101` even though `51` and `101` both return `'rejected'`. This is the breadth a reviewer
  needs; it is NOT shrunk.
- **The execution-salient subset — what actually RUNS.** One representative per predicted-output
  group. `51`/`50` both run (different boolean out); three of the fall-through four gray out (identical
  output, no effects); `101` grays against `51` (same `'rejected'` exit). A global `runMode`
  (`thorough` default / `intelligent`) toggles whether the UI runs the full set or grays the
  non-salient rows. Redundancy is decided on `(reachesExit, predicted-output)` — NEVER by execution
  (P4); effects are not yet modeled, so v1 grouping ignores them.

**A file's case count is not its testable breadth.** The execution set collapsing a converging branch
is a runtime economy, not the whole truth.

## What the stub repository is

Scalars are covered by the case set above — they stay as test cases and umbrella up the call chain
(the existing `follow-calls` / `through-caller` / cross-file-compose machinery). The **stub repository**
is the cross-system store for the value demands that **objects, arrays, and object-like sources (env)**
carry — the pieces worth pinning and correcting in isolation because their full picture is scattered
across many readers and their sources are often opaque.

- **Objects (typed):** per property, the values the code branches on, UNIONED across every file that
  reads that object TYPE, spliced onto the type's full property list. A property the code never reads is
  an honest `unknown` — we don't invent a value for it.
- **Arrays:** cardinality (empty / one / many / max) over per-element demands.
- **Env / opaque sources:** `process.env` is an object; `CODE` etc. are properties whose values are
  GUESSED from the branch literals (`CODE → {1, 2, other}`) and marked `guessed`.

A human opens a stub in isolation, sees which files use it, and corrects a value. The correction becomes
a real, P4-safe (human-supplied, never code-derived) test case that runs and can fail. A corrected value
that cannot satisfy a guard on its path is flagged BEFORE running.

## Resolved decisions (load-bearing)

- **Stub key — stable and committable, never a cache/node ID.** Objects key on the declared type
  identity `"<definitionRelPath>#<TypeName>"`, resolved to that canonical pair by the SAME reconciliation
  as import edges (TypeScript module resolution, re-export barrels followed with a seen-set). Env keys on
  `"process.env#<PROPERTY>"`. The key moves ONLY on a real rename/relocate — a change the human wants
  surfaced — exactly the stability contract the resolved index already lives by. Cache/coverage IDs are
  cache-internal by ruling and may never key a committed artifact.
- **Anonymous / structural object types are NOT stubbed.** Keying them on structure would force source
  spelling into identity and merge unrelated `{id:string}` shapes. They degrade honestly (operand
  `unknown` → branch admitted `undriven`), with a "name this type to make it stubbable" nudge (R10's
  declare-as-data pressure).
- **Cache vs committed split (D12).** Derived stubs live in `.assayer/cache/stubs/<namespace>.json` —
  layout-keyed, atomic-write, rebuilt from finished blobs by lookup, a twin of the resolved index.
  Human corrections live in `assayer/stubs/` — committed, OUTSIDE the cache, the file path carrying the
  stable identity (`assayer/stubs/objects/<relPath>/<Type>.json`, `assayer/stubs/env/<PROP>.json`). The
  two combine at display/consume time and are NEVER persisted merged; the overlay is in no hash, so an
  overlay edit does not invalidate the derived cache. A stale correction (its type/property no longer
  exists) is a P1 "rectify this" build error on the existing `errors[]` channel — the first concrete
  instance of the named-states-style committed-override-that-errors-on-stale-refs pattern.
- **Hermetic-project constraint (core CLAUDE.md §5.10).** The analyzer walk has no `node_modules`, so an
  IMPORTED object type cannot be enumerated in-walk. Locally-declared types are enumerated per file
  (`declaredTypes`); cross-file types are resolved at the stitch by lookup in the definition file's
  declared types. Per-property read facts need only the property NAME, the branched VALUE
  (`getLiteralValue()`), and the syntactic type-reference NAME — all available hermetically, so a
  `config.mode === 'x'` branch that types as `unknown` today still yields a per-property fact. Object
  types declared in `node_modules` are read later through the second, node_modules-aware project (the
  `read-external-signature` pattern); until then they degrade to `unknown`. Never add `node_modules` to
  the hermetic walk.

## How it is produced

- **Per-file blob (pure, content-keyed):** the walk records object/array TypeFacts (property enumeration
  for locally-declared types), the full property list of declared types (`declaredTypes`), and each
  branch's object-member operand (`operandPropertyPath` + the syntactic `operandTypeRef`). No child's
  facts, no cross-file lookups — the blob stays child-independent.
- **The stitch (`compile-stub-graph-broker`, a twin of `compile-resolve-graph-broker`):** over finished
  blobs, by lookup, keyed on the same layout + tsconfig hash. It inverts the resolved index to find every
  reader of a type, groups the per-property read facts by `(definitionRelPath, typeName)`, runs the
  existing scalar value math (`type-to-range` → `intersect-domains` → `domain-values`) per property,
  splices the unioned demands onto the definition's full property list (unread → `unknown`), and folds
  `process.env` reads into one env stub per property with guessed values. Writes the derived stub index.
  Alongside it returns the per-guard `guards` (`gather-property-guards`, the guard twin of
  `gather-type-reads`) — every object-member branch condition — so a committed correction can be checked
  against what each corrected value must satisfy.
- **Consume time (`stub-realize-broker`, a twin of `compose-cross-file-predicates-broker`):** re-reads the
  combined (derived + overlay) stub view per run, never persisted, and arranges object params from it
  (the `{kind:'object', param, value}` arrange discriminant), fanning cases per property-value combo. A
  property WITH a committed correction is AUTHORITATIVE: `object-arrange` uses ONLY the corrected values
  for it (no fallback to the branch literal). This is where a human correction becomes a runnable case.
- **Pre-run contradiction (`stub-contradictions`, folded into `compile-run-broker`'s `errors[]`):** because
  a correction is the property's authoritative domain, a guard it cannot satisfy (`mode === 'a'` where the
  corrected `mode` omits `'a'`) is dead code under the human's truth. For each guard the stitch gathered,
  it intersects the corrected values (a fixed-member domain) with the guard's satisfying domain
  (`type-to-range` → `intersect-domains`) and reports the ones `is-domain-empty` proves unreachable — the
  SAME emptiness machinery as the unreachable-exit lint — as a P1 naming the overlay file, the property,
  the reader:line, and what the guard needs, on the same channel as the stale-overlay reconcile (exit 1).
  It runs BEFORE any test does, so a bogus case is never emitted for the dead branch. Only a
  literal-carrying guard is judged; a truthy/falsy satisfying domain is a sample, never a constraint.

## The UI

The stub repository is a first-class view in the app at `/stubs`, reached from a top-level nav header
(the app shell: `Explorer` → `/`, `Stub Repository` → `/stubs`). It is fed by the `assayer:stubs` IPC
channel, which mirrors the status/tree/file/run quartet exactly — a desktop `stub-index-resolve-broker`
(the twin of `compiled-tree-resolve-broker`) reads the current namespace's DERIVED stub index from
`.assayer/cache/stubs/<namespace>.json`, loads the COMMITTED `assayer/stubs/` overlay from the SOURCE
repo root, and combines them at read time via `stub-view-transformer`, returning the merged `StubView`.
An empty (well-formed) view is returned when no cache manifest or stub index exists, the same empty-state
as the tree resolver. The view is read-only; editing the overlay from the UI is a later rung.

Each stub is a card. An OBJECT card shows its stable key (`<definitionRelPath>#<TypeName>`), the files
that READ it, and each property with either its demanded values or an `unknown` badge (a property no
reader branches on). An ENV card shows its `process.env#<PROP>` key, its values badged `guessed` (or
`corrected` where a committed human value flipped `guessed` off), and its readers. Where the merged view
can tell corrected from guessed it does — an env stub carries that on its `guessed` flag; an object
property's demanded values are the derived-or-corrected union and are shown as-is. The per-file TESTS tab
(in the explorer's detail panel) shows the full bucket set with the salient subset badged and the
non-salient rows grayed under `intelligent` mode.

## Where this fits — layered verification / the stub registry (R19 / D26)

D26 rules that layered verification is a QUERY over the maps, not a separate subsystem. The stub
repository is that query made concrete for object/env inputs: the reader-union inversion is the
cross-layer dependency-edge read; the per-type unioned demands are C3's consumption-partitioned salient
state; the `readers[]` list is the demanded-pair inventory (R19). Env-as-object is a bus/wire-boundary
opaque source (Q3) reduced to a declared, human-correctable model. A future run-time registry becomes a
read over this same stub index rather than new machinery.

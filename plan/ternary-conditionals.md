# Ternaries & assumed ternaries — build plan

Design source of truth for expression-level branches: the `?:` ternary and the
short-circuit forms (`&&`, `||`, `??`, `?.`) that desugar to one. Present-tense:
this describes the target and the sequence to reach it. Read `packages/core/CLAUDE.md`
(esp. §8, the exit-ownership note) before touching the analyzer.

## Why — one dark spot, two very different halves

`ConditionalExpression` is a significant kind, so a ternary anywhere is recorded
as an unhandled node and surfaces as a dark spot — honest, but zero cases. The
reason the standard "add a handler" recipe does not close it splits cleanly:

- **Exit position** (`return cond ? a : b`, `throw cond ? a : b`). The blocker is
  EXIT OWNERSHIP. `handle-exit-layer-adapter.ts` emits one unguarded exit BEFORE
  descending (`:41-58`), and exits merge upward (`walk-node-layer-adapter.ts:39`),
  so a branch inside the returned expression cannot make the `return` retract its
  own exit. The fix lives inside the exit handler: split its own exit per arm.
  Everything downstream — branch → `guardPath` → `derive-cases` — is reused
  unchanged, because an exit already carries a `guardPath` and `derive-cases`
  derives per exit from it (`derive-cases-transformer.ts:50-64`).

- **Value position** (`const x = cond ? y : z`, `f(cond ? y : z)`). The blocker is
  VALUE FLOW: `derive-cases` derives per exit from `exit.guardPath`, so a branch no
  exit's guardPath can mention derives zero cases and is inert decoration. Closing
  it needs following the binding to its consumption site. Deferred (see below); the
  marked dark spot already satisfies D22's blind-spot honesty in the meantime.

The **assumed ternaries** are a third axis crossing both positions: `a && b`,
`a || b`, `a ?? b`, `a?.b` are branch points with the same two-path shape, but
`read-condition-tree-layer-adapter.ts` already reads `&&`/`||` as CONNECTIVES (one
boolean tree) when they sit inside an `if`. In VALUE position they are branches
with different value-flow (`a ?? b` ≡ `a != null ? a : b`), and today the
`BinaryExpression`/optional-chain forms are not even in
`significant-syntax-kinds-statics.ts`, so `return a ?? b` is a hidden branch that
is silently dropped — a small soundness gap.

## What the design already rules (so this plan does not re-decide it)

- **Granular / case-per-path is the requirement.** `expectation-catalog.md:252`:
  "ternary, `?.`, `??` … → case per path." `features.md:393-395` lists `??` and the
  short-circuit forms as purity boundaries that earn cases.
- **The generated test asserts REACHABILITY, never the value (D21).**
  `derive-cases` already emits `reachesExit` and never records the returned value,
  so an exit-position ternary drops straight into the model — P4-safe by
  construction, no snapshot.
- **A visibly-marked blind spot is a first-class state (D22).** Value-position
  ternaries may remain a marked dark spot until value-flow lands; that is
  sanctioned, not a gap to apologize for.
- **Per-member completeness lives in the MAP (D22).** A value-distinction minted by
  a ternary is traced "to whatever branch consumes or swallows it." Exit-position
  ternaries do this now; value-position is the map-completeness goal that value-flow
  finishes.

## What already exists (reuse, do not rebuild)

- **Condition reading:** `read-condition-tree-layer-adapter.ts` takes the condition
  EXPRESSION, not the `if` — its own doc says a ternary can reuse it unchanged. It
  emits the leaf tree + probe sites.
- **Branch id + exit id:** `coverage-id-transformer.ts` + `project-node-layer-adapter.ts`
  (structural projection of the condition). `derive-branch-id-layer-adapter.ts` is
  `if`-typed (`.getExpression()`); a ternary derives the same id shape off its
  `.getCondition()`.
- **Guard/exit/case machinery, all reusable unchanged:** `exit-coverage-id`,
  `exit-causes`, `cause-arrange`, `type-to-range`, `domain-values`, `derive-cases`,
  and the `unreachable-exit` lint. A split exit carrying a `guardPath` is exactly
  what these already consume for an `if`.
- **Probe-site discipline:** every exit mints its site where its id is mints (core
  CLAUDE.md §5.11); the arm expression is the site for an expression exit.

## The build — rungs, each flips a real specimen

### Rung A — exit-position ternary (`return`/`throw cond ? a : b`)

The clean, fully-derivable piece. Specimen-first per core CLAUDE.md §6.

- **Specimen** `happy-path/ternary/in-return/in-return.ts` — e.g.
  `export const classify = (n: number): string => (n > 5 ? 'big' : 'small');` (and a
  block-bodied `return` sibling). Colocated `.test.ts` asserts the two branch-driven
  cases + the branch. Declared in `specimen-registry.ts` (`branch:ternary`,
  `access:named`) by READING the file.
- **New layer adapter** `read-conditional-exit-layer-adapter.ts` (+ proxy + test):
  given `{ expression, kind, context }`, returns `{ branches, exits, probeSites,
  descents }`. Recursive: if `expression` is a `ConditionalExpression`, read its
  condition as a branch (id off `.getCondition()` via `project-node` +
  `coverage-id`), then for each arm — if the arm is itself conditional, RECURSE with
  the arm's guard step appended; otherwise emit one exit (of `kind`) guarded by the
  extended guardPath, a probe site wrapping the arm expression, and a descent into
  the arm. Also descends the CONDITION under the enclosing guardPath with `tail`
  cleared (routes calls sited in the condition to `handle-call`, mirroring
  `handle-if`). Nested ternaries in an arm are handled by the recursion, not a
  second dark spot.
- **Wire `handle-exit-layer-adapter.ts`:** when the returned expression is
  conditional, delegate to the new adapter instead of emitting one unguarded exit;
  otherwise keep the current single-exit behaviour verbatim.
- **Branch node kind** `'ternary'` (already in `map-node-kind-statics.ts` and the
  shared `map-node-kind-contract`); confirm `branch-node-contract` admits it.
- **Flip the walk-adapter test** `ts-morph-walk-file-adapter.test.ts:438` — the
  "ternary in a return is unhandled" case becomes two guarded exits + a handled
  `ConditionalExpression` node. Update core CLAUDE.md §8 to state that exit-position
  is handled and value-position remains the marked blind spot.
- No new derivation machinery — the two split exits derive cases through the
  existing `exit-causes`/`type-to-range` path.

### Rung B — exit-position assumed ternaries (`return a && b / a || b / a ?? b / a?.b`)

Same exit-split mechanism, different desugaring, so it is a natural extension of the
Rung-A adapter — but it touches the predicate vocabulary, so it is its own rung.

- The left operand becomes the condition LEAF, read as a truthy / non-nullish check
  — distinct from `read-condition-tree`'s connective reading. Desugaring:
  - `a && b` → cond `a` truthy: then→`b`, else→`a`.
  - `a || b` → cond `a` truthy: then→`a`, else→`b`.
  - `a ?? b` → cond `a` non-nullish: then→`a`, else→`b`.
  - `a?.b` → cond `a` non-nullish: then→`a.b`, else→`undefined`.
- Needs predicate kinds for truthy / nullish / non-nullish that `type-to-range` can
  turn into satisfying/violating domains (`truthy` already exists as an opaque leaf;
  a NULLISH kind is new). Scope the solver extension to a single value, mirroring
  Rung A.
- Add the exit-position forms to `significant-syntax-kinds-statics.ts` (or emit the
  branch directly) so an un-split form is at worst a visible dark spot, never a
  silent drop.
- One specimen per form under `happy-path/ternary/` (or `boolean/`), each declared
  by reading the file.

### Rung C — value-position (DEFERRED — needs value flow)

`const x = cond ? y : z`, `f(cond ? y : z)`, JSX `{cond ? a : b}`. The branch does
not sit on any exit's guardPath, so `derive-cases` cannot mention it. Closing it
needs binding→use tracking: follow the bound value to the exit/consumption site it
flows into and attach the branch there. This is the map-completeness half of D22 and
the same value-flow the cross-file plan defers (`cross-file-constraints.md:157-159`).
Until it lands, value-position stays a VISIBLY MARKED dark spot (already the case) —
which D22 sanctions. Do not fall back to a fill.

## Solver scope (v1)

Rung A adds nothing to the solver — the condition is an ordinary comparison/truthy
leaf the existing `type-to-range` already handles. Rung B adds a nullish/non-nullish
predicate on a single value. No general solver; no transformed operands; no value
chains through locals (that is Rung C).

## Honest-admission invariant

When an arm cannot be decomposed (an opaque call condition, a form the reader cannot
name), admit it — descend it so a nested scope/call inside the arm is still found,
and let the un-decomposed piece read as the opaque leaf it is. Never invent a value
to make a branch look covered.

## Open decisions to confirm

1. **Rung A adapter as a dedicated layer file** vs. folding the recursion into
   `handle-exit`. Recommend the layer file — the recursion (nested ternaries) and the
   Rung-B extension both want their own unit tests, and `handle-exit` stays readable.
2. **Rung B's nullish predicate** — new predicate kind + `type-to-range` domain, or
   keep `??`/`?.` as a marked dark spot for v1. Recommend building it; the granular
   ruling wants the paths, and the exit-split is already there from Rung A.
3. **Rung C value-flow** — confirm deferral (marked dark spot) over investing in
   binding→use tracking now. Recommend defer; it is the larger, cross-cutting piece
   both this plan and the cross-file plan lean on.

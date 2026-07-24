# Assayer — Arrange Inputs (open defects)

> Scope: the VALUES a derived case hands to parameters its branch does not steer, and
> the missing integrity check over them. Everything here is one family of defect —
> branch derivation is correct throughout; only the fills are wrong.
>
> **Companion docs:** `packages/core/CLAUDE.md` §5 (non-negotiables) and §6 (the
> specimen recipe) bound every change below. `plan/requirements.md` holds the design
> rulings these sit under (P4, the four admissions, the artifact inventory).
>
> Verify with **both** `npm run ward` and `npm run test:syntax` — the specimen
> catalogue is not in ward's jest graph.
>
> **Probe before asserting.** Every value in this document was read off a real run,
> never reasoned about. Do the same before writing an expected string into a test.

## Current state of the reporting surface

These are BUILT and working; they make the defects below visible without fixing any of
them.

- `CaseStatus` is `passed | failed | errored`. **ERROR** = no verdict about the
  predicted exit was produced (the entry threw, was not callable, or reached no exit).
  **FAIL** = it ran, reached an exit, and it was the wrong one. Both fail the build; an
  ERROR is strictly less known than a FAIL, never a lesser one.
- The detail panel carries the failure message on the case row, and an unresolved case
  reads `predicted L4` rather than claiming `reaches L4` for an exit nothing reached.
- `assayer unit` saves its report to `runs/<runId>/console.txt`, keyed on the same
  content-hashed run id as the verdicts. The desktop run console follows the file
  selection and empties on an edit by that same key.
- `smoke-repo/.../src/sad-path/error/` holds the specimens that throw today.

## The defects

### 1. `stub-realize` bypasses the shared fill seam

`packages/core/src/brokers/stub/realize/stub-realize-broker.ts:216` calls
`representativeValueTransformer` directly instead of `fillParamTransformer`, so an
unsteered `number[]` beside a stub-realized object param is filled with `"abc123"`.

- Pinned by `sad-path/error/stub-sibling-array` → `extra.map is not a function`.
- `happy-path/array/sibling-fill` passes with the same fill done right. **That pair
  localises the bug** — the fix is routing, not new logic.

### 2. `fill-param-transformer` has only an array arm and a scalar arm

A CALLABLE or OBJECT parameter falls to the scalar arm.

- Pinned by `sad-path/error/callback-param` → `report is not a function`.
- Pinned by `sad-path/error/object-param` → `sink.write is not a function`.
- The object case is the sharper one: `Sink.write` is fully enumerated onto the param,
  so the fill had the shape available and discarded it.

### 3. Wrong values that pass SILENTLY — no specimen

`forward(size: number, payload: Map<string, number>)` receives `payload: "abc123"`;
`payload.size` reads the string's length (`6`); nothing throws; **the case passes**.

- It fits no bucket: not `sad-path/error/` (it does not error), not `happy-path/`
  (that would assert green over a wrong input). There is no verdict for "ran clean,
  wrong input", which is exactly why it is the hardest of these to catch.
- **Runtime cannot reach this by construction.** Only the static check in §5 can.

### 4. `type X = {…}` never reaches stub-realize — no specimen

`packages/core/src/adapters/ts-morph/walk-file/read-type-fact-layer-adapter.ts:64`
reads `readType.getSymbol()?.getName()`, which is `__type` for an alias-to-object-literal.
No `typeName` lands, `declaredTypes` comes back empty, and a leaf's
`operandTypeRef: 'Config'` resolves to nothing.

- Probed: `interface Config` → 2/2 passed; `type Config = { mode: string }` → **0 cases,
  UNDRIVEN, exit 0** — identical logic, opposite verdict.
- `getAliasSymbol()` is the likely fallback. Probe it rather than assume.
- Worst failure mode here: not an error but a **false admission** — it tells the reader
  to restructure code Assayer merely failed to name.
- **No `type X = {` exists anywhere in the smoke-repo catalogue.** Every object specimen
  uses `interface`, so the form most TypeScript repos prefer is unexercised.

### 5. No arrange-vs-declared-type integrity check

There is no TypeScript to typecheck, by ruling: the shim is `assayer.test.js` and the
cases are `cases.json` DATA (`assemble-shim-transformer.ts` — emitted `.test.ts` files
would be a second source of truth that drifts and invites hand-editing).

The check does not need `tsc`. Both halves are already in memory at derivation:
`entry.params[].type` (a `TypeDescriptor`) and the `ArrangeBinding` just built. "Does
this value satisfy this descriptor" is a pure structural comparison, and it is P4-clean —
a derived INPUT against a DECLARED type, nothing executed.

The contracts already model the right shapes — `param` carries scalars only *by
contract*, alongside `array` and `object` arms — so §1–§3 are all ROUTING errors: the
fill chose the scalar arm for something with a proper arm available. Nothing validates
the join, because a binding names its parameter by string while the type lives one
object over on `entry.params`.

A violation is a **P1 build error**, never one of the four admissions: Assayer
contradicting a type it read itself is its own invariant broken, not the reader's debt.

### 6. Object arranges are FLAT

```
array  arm:  value: z.array(arrangeValueContract)              ← recursive
object arm:  value: z.record(symbolName, representativeValue)  ← flat map of scalars
```

`ArrangeValue` is explicitly recursive, so `number[][]` arranges as `[[7]]`. There is no
object twin, so `{ db: { retry: { backoff: 'linear' } } }` is **not representable at
all**.

Probed against a three-layer `Config → db → retry`:

- The walk reads all three layers perfectly and the leaf captures
  `operandPropertyPath: ["db","retry","backoff"]` with `operandTypeRef: "Config"`. No
  information is lost on the way in.
- A branch on that deep path derives **0 cases and admits UNDRIVEN**, and its message
  misleads — it says "make the deciding value a parameter" when the real reason is DEPTH.
- An unsteered nested object param is filled with `"abc123"` and throws
  `Cannot read properties of undefined (reading 'host')`.

## Order of work

1. **§6 first.** Make object arranges recursive — the object twin of `ArrangeValue`,
   plus `object-arrange` and `collect-property-demands` following a multi-segment
   property path. Everything else depends on it: §5's check would otherwise compare a
   fully-nested `TypeDescriptor` against a value side that bottoms out one level in, so
   it would be **shallow by construction**. Fixing §6 also makes deep property branches
   drivable and retires the misleading UNDRIVEN message.
2. **§5** — the assignability guard, once there is depth worth checking. Place it at
   ONE seam where the case set is finalized so it covers every producer (`derive-cases`,
   `cause-arrange`, `stub-realize`, every `through-*`). Single-seam placement is exactly
   what would have caught §1.
3. **§1 and §2** — route every fill site through `fill-param`, and give it a callable
   arm and an object arm.
4. **§4** — the alias-symbol fallback, plus a `type X = {…}` specimen.

## Ratchet discipline

Every specimen under `sad-path/error/` is expected to LEAVE. The source in each is
ordinary, correct code, so when its fill is fixed the file MOVES to `happy-path/` — the
bucket is the run verdict, and the verdict changes.

Moving a specimen breaks literal paths elsewhere at run time only:
`run-unit-broker.integration.test.ts` names specimens directly, and the app e2es select
by `data-relpath`. Sweep with the `discover` tool before and after a move — native grep
is blocked in this repo.

## Open decision

A genuinely `unknown`-typed parameter has no declared type to check against, so §5
passes it and the placeholder fill stands.

**Should an unfillable parameter become an admission rather than a placeholder fill?**

This is a product-semantics ruling, not an implementation choice, and §5's design should
wait on it. The four admissions each name WHO OWES the work; a parameter Assayer cannot
construct a value for is closest to a GAP (the caller's debt, closable by a harness), but
filing it there commits to harness-based input authoring for arbitrary types.

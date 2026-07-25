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

## The ruling: there is no placeholder fill

If Assayer cannot construct a value OF THE RIGHT SHAPE for a parameter, that parameter
is UNFILLABLE and the entry derives NO cases. `is-type-fillable-guard` is the rule and
`fill-param-transformer` is the single authority that applies it; every fill site routes
through it, so what a parameter receives never depends on which derivation reached it.

A refusal is NOT `unreachable`. Unreachable means the guards contradict and the exit is
dead code — the repo's debt. Unfillable means the input is one Assayer cannot build —
nothing is dead. Merging them would report correct code as an unreachable-exit lint.

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
  content-hashed run id as the verdicts. The id keys on every INPUT to the result — the
  source and the colocated harness alike, since the values a harness supplies are the
  arguments the entry runs on — so the desktop run console follows the file selection and
  empties on an edit to either by that same key.

## Refusal has a voice — the gap channel

A refused parameter is a **GAP**: the caller's debt, closable by a harness. It rides
`FileAnalysis.gaps` (required, like `darkSpots`), so a file admits it the moment it is
opened rather than only after a run — the reads-as-complete lie lives in the analysis.

- `derive-cases` reports `unfillable` (deduped across buckets); `input-gap-transformer`
  is the one home of the P1 invoice text; `analyze-file-broker` files it.
- `case-set-projection` CONCATENATES it with the access-shaped gaps it computes — one
  channel, two producers, one `{ name, reason }` shape (`entry-gap-contract`).
- A parameter is only refused once its DECLARED type is in hand. `param-type-resolve`
  runs ahead of every other consume-time overlay and gives an imported parameter the
  shape its declaration says — turning on the declaration alone, never on how the entry
  happens to branch — so the invoice is raised only where nothing in the repo can build
  the value.
- `stub-realize` CLEARS the gap for an entry it drives: a cross-file object param the
  hermetic walk cannot type is refused per-file and arranged from the merged stub view
  at consume time, so the invoice is paid, not reprinted.
- `harness-realize` CLEARS it the other way — with the value a human supplied. The
  colocated `<basename>.harness.ts` is found by basename plus the symbol gate, loaded by
  running it, and each invoiced entry is re-derived through the SAME `derive-cases` with
  the supplied parameters bound to `inputs.<entry>.<param>` key paths. Supply everything
  that was refused and the invoice goes; supply some of it and the gap stays, re-worded to
  name only what is still missing. The VALUES are resolved at run time — the shim loads
  the same file and `jest-interpret-case` walks the key path — so a key the declaration no
  longer carries is an ERRORED case naming it, never a silent `undefined` argument.
- Severity is the global `inputGaps: off | warn | error` (default `error`), and
  `unit-run-responder` fails the run on it beside the dark-spot and lint toggles.

## The defects

### 1. No arrange-vs-declared-type integrity check

There is no TypeScript to typecheck, by ruling: the shim is `assayer.test.js` and the
cases are `cases.json` DATA (`assemble-shim-transformer.ts` — emitted `.test.ts` files
would be a second source of truth that drifts and invites hand-editing).

The check does not need `tsc`. Both halves are already in memory at derivation:
`entry.params[].type` (a `TypeDescriptor`) and the `ArrangeBinding` just built. "Does
this value satisfy this descriptor" is a pure structural comparison, and it is P4-clean —
a derived INPUT against a DECLARED type, nothing executed.

Routing every fill through one seam removed the class of bug this would have caught, so
what remains is the ratchet: a NEW producer that builds a binding by hand can still
disagree with the type, and nothing validates the join because a binding names its
parameter by string while the type lives one object over on `entry.params`.

A violation is a **P1 build error**, never one of the four admissions: Assayer
contradicting a type it read itself is its own invariant broken, not the reader's debt.

### 2. Object arranges are single-segment on the CONSTRAINED side

`fill-value-transformer` builds a nested object value for any declared shape, so an
unsteered `{ db: { retry: { backoff: string } } }` param is a real nested object. What
is still flat is the CONSTRAINED side: `object-arrange` and `collect-property-demands`
match only a single-segment property path, so a branch on a deep path derives nothing.

Probed against a three-layer `Config → db → retry`:

- The walk reads all three layers perfectly and the leaf captures
  `operandPropertyPath: ["db","retry","backoff"]` with `operandTypeRef: "Config"`. No
  information is lost on the way in.
- A branch on that deep path derives **0 cases and admits UNDRIVEN**, and its message
  misleads — it says "make the deciding value a parameter" when the real reason is DEPTH.

### 3. A truthy guard on a PARAMETER is arranged truthy on both arms

`object-arrange` refuses the falsy arm of a truthiness read on a property with no scalar
point (`is-falsy-arm-guard` is the rule), so `if (config.db)` derives ONE case. The same
read of the PARAMETER itself does not: `cause-arrange` fills the param from the seam on
both arms, and every value the seam builds — `{}`, `[]`, `{ host: 'abc123' }` — is truthy.

Probed:

- `if (config)` on a `Config` param → **2 cases**, both arranging `{ mode: 'abc123' }`.
  The one predicting the else exit cannot reach it, and fails against correct code.
- `if (tags)` on a `string[]` param → **6 cases** (3 cardinalities × 2 arms). All three
  else cases arrange a truthy array, `[]` included.

The rule and its guard already exist and are tested; what is missing is the refusal path
in `cause-arrange`, whose `unfillable` channel is already carried out for the
`fill-param` case. No specimen exercises either form yet.

## Order of work

1. **§3** — the refusal path in `cause-arrange`, so a truthy guard on a parameter stops
   deriving a case that cannot reach the arm it predicts. It fails a build against correct
   code, which outranks the other two.
2. **§2** — multi-segment property paths through `object-arrange` and
   `collect-property-demands`, retiring the misleading UNDRIVEN message.
3. **§1** — the assignability guard, placed at ONE seam where the case set is finalized
   so it covers every producer.

Defects OUTSIDE this document's scope — the values a case hands its parameters — are in
`plan/open-defects.md`.

## Ratchet discipline

The bucket is the RUN VERDICT, never a judgement about the source. Every specimen under
`sad-path/input-gap/` is ordinary, correct code one committed `<basename>.harness.ts`
away from running clean — which is what the `happy-path/harness/` twins show: byte for
byte the same source, plus a harness, and the verdict moves. A specimen leaves the
sad-path bucket when its own verdict changes, not when the feature that could change it
lands.

Moving a specimen breaks literal paths elsewhere at run time only:
`run-unit-broker.integration.test.ts` names specimens directly, and the app e2es select
by `data-relpath`. Sweep with the `discover` tool before and after a move — native grep
is blocked in this repo.

# Assayer — Followups

> Work that is not a defect. Two kinds live here.
>
> **Capability Assayer does not have yet** — a shape it REFUSES honestly, with an accurate
> invoice naming the type as the source spells it. The reader is told the truth and can act
> on it. Closing one means teaching Assayer to BUILD the shape; never change the message to
> make the gap quieter.
>
> **Structure that keeps producing defects** — code that is correct today but arranged so
> that the next change to it is likely to be wrong. Closing one means removing the
> opportunity, not fixing an instance.
>
> An entry graduates to `plan/open-defects.md` only if something here starts LYING — deriving
> a case that fails against correct code, reporting coverage that did not happen, or printing
> a reason that is not the reason.
>
> **Probe before asserting.** Import by absolute path under `npx tsx`; run the built CLI at
> `packages/cli/dist/bin/assayer.js` for anything end-to-end.

## Four routes hand-assemble the same call to `derive-cases`

**This one has a measured cost: eight defects traced to it.** Everything below is currently
correct — the entry is here because the arrangement invites the next one.

### The structure

Case derivation itself is properly funnelled. One walk, one parse, one
`deriveCasesTransformer` engine, one `fillParamTransformer` fill authority. That held up.

What is not funnelled is the GLUE. Four routes each answer "given this scope, what options
does `derive-cases` need?" in their own hand-written call:

- `through-caller-cases-transformer.ts` — a private reached by a resolvable named call
- `through-callback-cases-transformer.ts` — an array-iteration callback
- `through-invocation-cases-transformer.ts` — an IIFE, module-load code
- `funnel-named-cases-transformer.ts` — a private folded into a branchless surface

(`funnel-cases-transformer` does not call the engine at all; it delegates to
`through-callback-cases`, and correctly inherits whatever that route does.)

Each was written for a different syntax shape, at a different time, by whoever needed it. So
when an axis is added to `derive-cases`, it reaches whichever route the author had open.

### What it has already cost

Every one of these was a capability present in one route and absent in a sibling. None was
visible reading the file it lived in — each file was internally consistent and passed review.

- **`predicateSignature` → `returnPredicate` was threaded by three routes and not by
  `through-callback-cases`.** A branchless callback has no `if`; its true/false split rides
  the return comparison. Without the thread it collapsed to ONE case. That is the shape of
  `.filter`, `.some`, `.every`, `.find` — so `ns.filter((n) => n > 5)` derived
  `arrange: [{kind:'array', value:[7]}]` and never fed the predicate a failing value.
  Changing `>` to `>=` would not have gone red.
- **Rest-parameter spreading** landed on the `array` binding arm; the `harness` arm beside it
  applied `[[cb]]` instead of `[cb]`.
- **The falsy-arm refusal** was implemented at PROPERTY level in `object-arrange` and absent
  at PARAM level in `cause-arrange`, so a truthy guard on a parameter arranged truthy on both
  arms.
- **`hasCases` on the invoice** was threaded at two call sites and not the third.
- **`declaringScopes`** admits two routes and not four — that one is DELIBERATE and documented
  (see below), which is exactly why the seam has to make refusal explicit rather than silent.

Two more of the same family sat outside these routes and are worth knowing about, because
they show the shape is not confined to this seam: `assayer detail` rendered one admission
channel while `assayer unit` and the desktop rendered four, and three sibling type readers
drifted apart on arrays, alias names, and `optional`.

### Why the fixes did not close it

Each was fixed by adding the missing line to the second copy. The copies remain. The next
axis added to `derive-cases` can go missing the same way, and nothing fails when it does —
the route simply derives fewer cases and reports them as complete.

### What closing it looks like

ONE seam that maps a scope onto `derive-cases`' options, called by all four routes. A new
axis then reaches every route by construction, and a route that genuinely should not receive
one has to say so in code rather than by omission.

Scope it to the assembly only. **Do not change `deriveCasesTransformer` itself** — it is the
engine and it is not the problem.

### The asymmetries that MUST survive

A naive consolidation would flatten these into uniformity and be worse than the duplication.
Each is deliberate, probed, and documented:

- **`through-invocation-cases` derives over `params: []`.** A module is driven by importing
  it, not by calling it, so an IIFE's parameters are never applied by a caller. Its inputs
  are env reads and welded invocation arguments. It must not gain param handling.
- **Only `funnel-named-cases` appears in `declaringScopes`.** `through-caller-cases` and
  `through-invocation-cases` produce their own top-level entries, so there is nothing folded
  to name. A funnelled CALLBACK is excluded because its refused parameter is the ARRAY ELEMENT
  itself, and `ArrangeValue` has no variant for a harness key path inside a composite —
  admitting it would let `harness-validate` accept a key `harness-realize` can never bind.
- **`through-caller-cases` and `funnel-named-cases` do not build rest arrays**; they rebase a
  binding the callee's own derivation already produced, so `rest` rides through on the spread.
  Only routes that build a fresh array value need explicit handling.
- **`compose-cross-file-predicates` produces no gaps at all** — it rebases branch conditions
  and never fills a parameter, so `unfillable`/`owner`/`hasCases` do not apply to it.

### How to verify

Behaviour must be byte-identical per route, before and after. Probe each of the five routes
through the real transformers, capture the full derived case set, refactor, re-probe, diff.
`npm run test:syntax` is the other half — the catalogue exercises all five through real
parses, and it has already caught one wrong conclusion in this area that unit tests missed.

### Not part of this

The three type readers (`read-type-fact`, `read-signature-type`, `read-global-type`) are
duplicated too, and CANNOT be merged: the architecture forbids layer files importing across
domain folders, and each file's own header says so. They were made byte-exact rather than
approximate. Leave them; a shared entry file is a different, larger decision.

## Input shapes the fill seam cannot build

Each derives 0 cases and a GAP, exit 1.

`v: Ay & Bee` (intersection), `when: Date`, `task: Promise<string>`,
`` t: `id-${string}` `` (template literal), `payload: Map<string, number>`,
`pair: readonly [string, number]`.

`Date` and `Promise` enumerate as objects of ~40 callable members, so every method-bearing
lib type refuses by that one route — a single seam decides all of them.

Closing it lives in `read-type-fact` / `is-type-fillable`.

## A `typeof` narrowing is not decomposed into operand + predicate

```ts
export const choose = (target: Plain | string): string =>
  typeof target === 'string' ? target : target.label;
```

Correctly NOT invoiced — the union fills — but `read-condition` does not decompose the
`typeof` form, so the leaf carries no `operandParamName` and the branch cannot be steered.
The satisfying domain per union member is derivable, so this is buildable when it comes up.

`derive-cases` names the shape it hit (`unarrangeable-typeof`) so the admission reads "does
not decompose a `typeof` comparison" rather than the generic "make it a parameter" — worded
honestly today, closing the capability is still this entry.

## A constrained property path is matched only one segment deep

`fill-value-transformer` builds a nested object value for any declared shape, so an
unsteered `{ db: { retry: { backoff: string } } }` param is a real nested object. The
CONSTRAINED side is flat: `object-arrange` and `collect-property-demands` match only a
single-segment property path.

Nothing is lost on the way in — probed against a three-layer `Config → db → retry`, the
walk reads all three layers and the leaf captures
`operandPropertyPath: ["db","retry","backoff"]` with `operandTypeRef: "Config"`. Closing it
means following a multi-segment path through both transformers.

`derive-cases` names the shape it hit (`unarrangeable-property-depth`) so the admission
reads "matches an object-member comparison only ONE property level deep" rather than the
generic "make it a parameter" — worded honestly today, closing the capability is still this
entry.

## A cross-file object-MEMBER leaf keeps an opaque operand type

`param-type-resolve` substitutes a leaf's `operandType` by type reference, so a DIRECT param
read (`level === 'low'` typed `Level`) gets its declared union and fans out per member. An
object-MEMBER read (`config.mode` on an imported `Config`) does not: the member access has
no type node of its own, so its leaf carries no `typeRef` and `operandType` stays
`{kind:'unknown', text:'any'}`.

The derived CASES are correct — `stub-realize` arranges those branches from the stub view's
per-property demands. What reads wrong is the enrichment panel, which shows `any` on the
branch line, and any future consumer of the leaf's operand type would read a collapsed one.

Indexing the resolved object descriptor by `operandPropertyPath` would close it.

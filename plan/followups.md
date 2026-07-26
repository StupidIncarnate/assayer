# Assayer — Followups

> Capability Assayer does not have yet. Nothing here is a defect: every entry is a shape
> Assayer REFUSES honestly, with an accurate invoice naming the type as the source spells
> it. The reader is told the truth and can act on it.
>
> An entry graduates to `plan/open-defects.md` only if it starts LYING — deriving a case
> that fails against correct code, reporting coverage that did not happen, or printing a
> reason that is not the reason.
>
> Closing any of these means teaching Assayer to BUILD the shape. Never change the message
> to make the gap quieter.
>
> **Probe before asserting.** Import by absolute path under `npx tsx`; run the built CLI at
> `packages/cli/dist/bin/assayer.js` for anything end-to-end.

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

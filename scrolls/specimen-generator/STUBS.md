# Specimen generator: the stub dimension

A hole can take its value from a property of an object parameter, such as `settings.limit`. Assayer
decides that value from its stub view: the values it derived from the code, plus any value a human
corrected. This file plans how the generator covers that. Nothing here is built yet.

The root `CLAUDE.md` and `packages/core/CLAUDE.md` section 9 describe the Assayer side in full.

## The two halves Assayer already has

| Half | What it is | Where it lives |
|---|---|---|
| Derived stub index | Each object type's full property list, with a value demand on every property a branch reads. Assayer gathers it by watching which properties branches read | `.assayer/cache/stubs/<namespace>.json`, rebuilt on demand |
| Stub corrections | Values a human writes to override the derived ones | `assayer/stubs/`, committed, keyed by the type's definition file and name |

When Assayer builds a test, it merges the two and arranges the object parameter from the result. Each branch
arm becomes a case. A corrected property is authoritative: only its corrected values are used.

## What the generator adds

### A `prop` provenance

A hole is filled by reading a property of an object parameter. With `settings: Settings`, where
`type Settings = { limit: number }`, `gt`'s `value` becomes `settings.limit`:

```ts
type Settings = { limit: number };

export function report(settings: Settings): string {
  if (settings.limit > 5) {
    return 'then';
  }
  return 'else';
}
```

Assayer derives the demand on `limit` from that comparison.

### Object types in the type list

`types.ts` gains object shapes, such as `{ mode: 'a' | 'b'; limit: number }`. The generator writes each one
into its specimen as a type alias.

### A corrections dimension, crossed with every `prop` specimen

| Correction | Files the specimen has | Predicted |
|---|---|---|
| None | the specimen | Driven, from the derived demands alone |
| One that agrees with the type | the specimen, plus a correction under `assayer/stubs/` | Driven, with the corrected values as the cases |
| One that names a property the type does not have | the same two files | A P1 build error, from `stub-overlay-reconcile-broker` |
| One whose values can never satisfy a branch, such as `mode` corrected to `['b']` when the code checks `mode === 'a'` | the same two files | A P1 build error, from `stub-contradictions-transformer` |

## What this changes in the generator

1. **A specimen can be more than one file.** A correction file is the first case. A harness file is the
   next, for the gap dimension: the same specimen with and without a harness.
2. **Each specimen needs its own type name.** Corrections are keyed by type. Two specimens sharing one type
   would share corrections.
3. **A prediction can be a P1 error.** The generated test asserts the exact error text. That text needs a
   template the generator fills in, declared independently of Assayer. The wording itself already exists
   in core, in the two files named above.

## Open questions

| Question | Why it matters |
|---|---|
| Where do generated correction files live? `assayer/stubs/` sits at the root of the repo Assayer reads. Every generated specimen shares that one folder | Corrections for one specimen must not leak into another |
| Do `prop` holes nest, as in `settings.items.at(0)`? | A property can itself be an array or an object |
| More provenances with special meaning will turn up as more gets declared | Each one is a new row in `provenances.ts`, with its own prediction rule |

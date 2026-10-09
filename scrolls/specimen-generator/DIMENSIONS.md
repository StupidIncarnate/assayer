# Specimen generator: every list the generator iterates over

The generator builds specimens by crossing a few lists. This file names every list, says where it is
declared, and shows how the lists multiply into a specimen count. It is here to judge whether the matrix
scales.

The lists are declared in `tmp/specimen-generator-prototype/configs/`. `vocabulary.ts` holds the shared
lists. Each entry config holds its own per-syntax lists. `FUTURE-BLOCKS.md` lists candidates for each one.

## The lists

| List | Declared in | Current members | What one more member costs |
|---|---|---|---|
| **Syntaxes** | One config each, under `configs/syntax/<group>/<name>/` | `array/at`, `array/length`, `string/length`, `control-flow/if-gt`, `control-flow/if-opaque` | One more set of specimens, sized by the formula below |
| **Containers** | `vocabulary.containers` | `module-scope`, `function-params`, `function-literal-arg`, `passthrough`, `object-prop` | One more term in every syntax that allows it |
| **Sources** | `vocabulary.sources` | `param`, `literal`, `same-file-const`, `call-arg-literal`, `opaque-call` | One more option for every hole that lists it, in every container that offers it |
| **Syntax sources** | A hole's `sources`, as `{ syntax: '<group>/<name>' }` | `array/length` and `string/length` can fill `array/at`'s `index` | One more option for that hole, in every container |
| **Literal keys** | A hole's `literals` | `array/at.index`: `in-range`, `past-end`. `if-gt.value`: `below`, `above`. One key each elsewhere | Multiplies a known source's options for that hole |
| **Generic types** | An entry's `generics` | `array/length`: `T` is `number` or `string`. `array/at`: `number` only | Multiplies that whole syntax |
| **Demands** | `vocabulary.demands` | `cardinality`, `index-free`, `index-known`, `gt`, `string-size` | No new specimens. A new value, such as `NaN`, adds test cases inside the existing specimens |
| **Type samples** | `vocabulary.types` | `number`: 7 to 13. `string`: `abc123` and variants | No new specimens. Changes the values inside test cases |

Only the first six lists create specimens. Demands and type samples change what is inside each test, not
how many tests there are.

## How the lists multiply

For one syntax:

```
specimens = for each generic type:
              for each container the syntax allows:
                multiply, over every hole:
                  the number of options that hole has in that container
```

A hole's options in a container are:

- each source in the hole's `sources` that the container offers, or that is `literal`
- a known source counted once per literal key
- each `{ syntax }` source counted once

### Worked example: `array/at` in `function-params`

| Hole | Options | Count |
|---|---|---|
| `chain` | `param`, `literal` | 2 |
| `index` | `param`, `literal` in-range, `literal` past-end, `array/length`, `string/length` | 5 |

2 times 5 is 10 specimens.

## Measured counts (prototype run on 2026-10-08)

| Syntax | `module-scope` | `function-params` | `function-literal-arg` | `passthrough` | `object-prop` | Total |
|---|---|---|---|---|---|---|
| `array/at` | 4 | 10 | 12 | 10 | 4 | 40 |
| `array/length` | 2 | 4 | 2 | 4 | 2 | 14 |
| `string/length` | 2 | 2 | 2 | 2 | 2 | 10 |
| `control-flow/if-gt` | 2 | 1 | 2 | 1 | 0 | 6 |
| `control-flow/if-opaque` | 0 | 1 | 1 | 0 | 0 | 2 |
| All | | | | | | 72 |

Plus 1 complex specimen.

`array/at` is the largest because it has two holes with many options each. Its count grows with every
source added to `index`. Each new syntax source, such as another `.length`, adds 5 specimens: one per
container.

## What makes it grow fastest

1. **Syntax sources.** Every syntax that can fill a hole adds one option to that hole in every
   container. Allowing every `number`-returning syntax to fill every `number` hole would grow as
   (number-returning syntaxes) times (holes that take a number) times (containers).
2. **Nesting depth.** Today a nested syntax's own holes get one fixed source each. Letting them iterate
   their sources too would multiply again at every level.
3. **Containers.** Each new container adds a term to every syntax at once. `FUTURE-BLOCKS.md` lists the
   candidates.

Generic types and literal keys stay small, because each one only multiplies its own syntax or hole.

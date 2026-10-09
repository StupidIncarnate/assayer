# Stress test 2: every config prop, one at a time

Run on 2026-10-08 against master at `fc1b4d9`, with the typecheck fix uncommitted.

## What was run

1. **A mutation test of every prop.** `tmp/specimen-generator-prototype/mutate.py` copies the configs,
   changes one prop, regenerates, and compares the output with an unchanged run. A change should either
   change the output in the expected way, or stop the generator with a clear error. A change that does
   nothing means the prop is dead or not wired up.
2. **Fixes** for everything the mutation test turned up.
3. **A new sad-path syntax**, `control-flow/if-opaque`: an `if` over a helper that returns
   `Math.random() > 0.5`. No test can set that value, so Assayer should report the branch as undriven.
4. **An Assayer run** over everything the configs generate.

The generated folders were deleted afterwards. The smoke-repo is unchanged.

## Mutation test results

The first run had 52 mutations, and 9 of them did something unexpected. After the fixes, the final run
has 79 mutations, and every one behaves as expected.

What the mutation test found:

| Problem | Example | Fix |
|---|---|---|
| Props the generator never read | `sources.*.settable`, and a complex entry's `containers` | `settable` now decides which holes a test sets. A complex entry must list every container as `false` |
| Typos silently ignored | `literal:` instead of `literals:` did nothing | Every config object now accepts only the props the generator reads |
| Props that duplicated another | `expressionSlot` always followed from `entryKind` | Deleted |
| Props on containers that can't use them | `arm` and `armResult` on `object-prop`, `armResult` on `module-scope` | Deleted |
| Syntax knowledge hard-coded in the generator | The hole names `value`, `limit` and `chain`, the helper name `inner`, the comparison `value > limit`, and a check for the container named `function-literal-arg` | New props replace each one: `decide` on a branching syntax, `calls` on a container, `from` in a demand, `armExits` on a container |
| A flip that crashed the generator | Flipping `sources.*.known` crashed with "no literal form for undefined" | Checked up front, with a clear error |
| No way to declare expected admissions | Every generated test asserted no undriven branches, dark spots or gaps | A syntax entry's admissions come from outcome rules. A complex entry writes them out |

`SAMPLE-CONFIG.md` lists every prop as it stands now.

## Assayer run

The configs generate 72 syntax specimens and 1 complex specimen, with 146 tests. 106 passed and 40
failed.

- The complex harness specimen passed.
- `control-flow-if-opaque-function-params` passed. Assayer reports one undriven branch, as predicted.

The 40 failures by cause:

| Cause | Status | Specimens | Example |
|---|---|---|---|
| A. A private helper's `return` is not in the path | Assayer changes, decided | 25 alone, 7 more combined with B, D or F | `array-length-function-literal-arg-number`: the config expects `inner`'s return on line 2. Assayer's path holds only the entry's return |
| B. `.at`'s values are lost through a passthrough | Assayer changes, decided | 3, all combined with A | `array-at-passthrough`: the config expects index `0`, `-1` and `7`. Assayer tries only `7` |
| C. A plain index into a fixed array ignores its known length | Assayer changes, decided | 1 | `array-at-function-params-chain-literal`: the config expects indexes 0 to 3. Assayer tries `0`, `-1` and `7` |
| D. `.length` of one unknown array used as an index into another | Open | 1, plus 1 combined with A | `array-at-function-params-index-array-length`: Assayer crosses an empty, one-item and two-item version of each array |
| E. A dead arm at module scope after a fall-through `if` | Assayer changes, decided | 2 | `control-flow-if-gt-below`: the config expects an `unreachable-exit` lint on line 3. Assayer reports none |
| **F. A string parameter gets only one value** | **New. Needs a decision** | 3, plus 3 combined with A | `string-length-function-params`: the config guessed `''`, `'a'` and `'abc123'`. Assayer tries only `'abc123'`. So in `[10, 20, 30].at(text.length)` the index is always 6, and the in-range outcome is never tested |
| **G. An opaque branch inside a private helper is reported nowhere** | **New. Looks like an Assayer gap** | 1 | `control-flow-if-opaque-function-literal-arg`: the config expects one undriven admission. Assayer reports no cases and no admissions, so the file looks clean while nothing in it was tested |

Cause G matters most of the new ones. It is a silent false success: Assayer says nothing is wrong
because it tested nothing.

No prediction rule was changed to match Assayer's output.

## New findings about the config shape

1. **`decide` repeats the template's condition.** `if-gt` writes `value > limit` in its template and
   again in `decide`. If the two drift apart, the generated tests fail against Assayer, so the drift
   gets caught. But it is one fact written in two places.
2. **Lint wording depends on what the branch is locked to.** Assayer words the message differently for
   a variable locked to one value, an array locked to a fixed length, and a condition made only of
   literals. The config has a template for the first only.
3. **`inverse` is unused on a syntax nobody nests.** The generator does not flag it.
4. **A complex entry can apply at most one overlay,** and only `harness-realize` exists. More overlays
   will need a list.

## Decisions needed

1. **Cause F:** should Assayer try more than one string value? If so, which values? Or is one value the
   intended behavior?
2. **Cause G:** should Assayer report an opaque branch inside a private helper as undriven?
3. **Finding 1:** keep `decide` as a separate declaration, or have the generator read the condition from
   the template? Reading it from the template removes the repetition. Keeping `decide` keeps the
   prediction independent of the code it predicts.

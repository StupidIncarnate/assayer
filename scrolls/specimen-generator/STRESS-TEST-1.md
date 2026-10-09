# Stress test 1: running the sample config for real

Run on 2026-10-08 against master at `fc1b4d9`.

## What was run

1. A prototype generator, in `tmp/specimen-generator-prototype/`, consumed the configs in
   `SAMPLE-CONFIG.md`.
2. It wrote 52 syntax specimens and 1 complex specimen into `smoke-repo/packages/syntax-repository/src/`,
   each with a generated test.
3. `npm run test:syntax` ran those tests against Assayer.
4. The generated folders were then deleted. The smoke-repo is unchanged.

## Results

**The config shape worked for consuming and generating.** Every template parsed, every hole resolved by
symbol, and every generated specimen was valid TypeScript. Nested syntax, renaming and parentheses all
came out right. One example: `[10, 20, 30].at(lengthChain.length)`.

**Assayer agreed with 78 of 106 generated tests.** Each specimen gets two tests. Every one of the 53
"nothing admitted as undriven, a dark spot or a gap" tests passed. All 28 failures are in the predicted
cases and lints.

Those 28 failures have five causes. The decisions section at the end says which side changes for each
one. No rule was changed to match Assayer's output. Copying Assayer's answers into the rules would take
expected values from the code under test, which rule P4 forbids.

| Cause | Specimens | What the config predicted | What Assayer produced | Detail |
|---|---|---|---|---|
| A. A private helper's exit without a branch | 24 | The path holds `inner`'s `return`, then the entry's `return` | The path holds only the entry's `return` | Today `inner` adds an exit to the path only when it branches, as in `welded-arg` |
| B. `.at`'s index values through a passthrough | Part of the 24, including `array-at-passthrough` | `index` gets `0, -1, 7`, as it does with no passthrough | `index` gets only the placeholder `7` | The values `.at` needs for `index` do not travel back through a same-file caller |
| C. A plain index into an array of known length | `array-at-function-params-chain-literal` | `[10, 20, 30].at(index)` gets indexes 0 to 3 | It gets `0, -1, 7`, as if the length were unknown | `[10, 20, 30].at(x.length)` does use the known length, so the two paths disagree |
| D. `.length` feeding `.at` when neither array is known | `array-at-function-params-index-length` | `lengthChain` arrays sized from the index values `0, -1, 7` | `chain` and `lengthChain` each get `[]`, `[7]` and `[7, 8]`, crossed: 9 cases | The config's rule was a guess |
| E. A module-scope `if` whose `else` falls through | `if-gt-below`, `if-gt-above` | The `then` arm is its own exit. With `value` locked to `3`, the dead `then` arm gets an `unreachable-exit` lint | One exit, `exit@top`, and no lint | The same code inside a function gets the lint. At module scope the dead `console.log('then')` is reported nowhere |

## Problems found in the config shape itself

1. **A literal that is part of the syntax needs no source.** The `limit` in `if-gt` only ever comes
   from a literal, and `passthrough` does not offer literals, so the generator produced nothing for
   `if-gt` in `passthrough`. The prototype now accepts `literal` in every container, because an inline
   literal needs no declaration.
2. **Literals have to vary with the generic type.** `length` with `T = string` still used the literal
   `[10, 20, 30]`. It compiled only because the generated `const` has no type annotation. `literals`
   needs one value per generic type, or a value built from the type's `sample`.
3. **Module-scope specimens collide in TypeScript.** A file with no `import` or `export` is a script, so
   two generated module-scope specimens that both declare `const value` clash in TypeScript's single
   global scope. The hand-written specimens on master do not clash with each other. The `module-scope`
   container needs to make each file a module. Adding `export {};` would do it, but whether that changes
   Assayer's analysis needs checking.
4. **How a demand carries into a nested syntax was hard-coded.** For
   `[10, 20, 30].at(lengthChain.length)`, the generator has to turn "indexes 0 to 3" into "arrays of
   length 0 to 3". This run did it with a special case for `length`. The configs now declare the
   conversion with an `inverse` prop on `array/length` and `string/length`.
5. **The complex entry's hand-written expectation was wrong once.** Assayer's arrange for a harness
   parameter also carries `key: 'inputs.audit.report'`. The test caught it, which is the intended
   behavior for a complex entry.
6. **The generator prints with no blank lines.** The TypeScript printer drops blank lines between
   statements. The generator reads line numbers from its own formatted output, so nothing breaks. The
   files are just denser than the hand-written ones.

## A problem found outside the generator

`npm run typecheck:syntax` failed on master without any generated files present. The smoke-repo's
tsconfig could not resolve core's `#gateway/...` imports or `@assayer/shared/transformers`. A fix is in
the working tree, uncommitted. `PLAN.md` lists its files.

## Decisions (2026-10-08)

| Cause | Decision | What changes |
|---|---|---|
| A. A private helper's `return` is not in the path | **Assayer changes.** Assayer should record "inline exits": every point where a value is produced and handed on, not only the finish lines of a branch. A helper's `return` is one. A ternary whose result is assigned to a variable is another. Assayer can then follow a value back up the chain and see every change made to it along the way. | The config's prediction stays as it is. Assayer has to start reporting these points. |
| B. `.at`'s index values are lost through a passthrough | **Assayer changes.** Assayer does not yet follow values into inner functions, and does not yet handle recursion. | The config's prediction stays. Assayer has to carry a callee's value needs back to the caller's parameters. |
| C. A plain index into a fixed array ignores the known length | **Assayer changes.** Assayer should sort fixed values in the code ("statics") into values it can know, like the 3 items in `[10, 20, 30]`, and values it cannot know. It should pick its test values from the ones it can know. | The config's prediction stays. Assayer has to use the known length for a plain index too. |
| D. `.length` of one unknown array used as an index into another | **Open.** Nobody has decided how Assayer should handle this yet. | Nothing yet. Today Assayer tries an empty, a one-item and a two-item version of each array, crossed: 9 cases. |
| E. Dead code at module scope after a fall-through `if` is not reported | **Assayer changes.** Catching cases like this is the reason for the combination matrix. | The config's prediction stays. Assayer has to report the dead arm at module scope the way it does inside a function. |

So four of the five causes are Assayer changes, and the generated tests that catch them stay failing
until Assayer is fixed. Only cause D is still undecided.

## Still undecided

1. Cause D, above.
2. The module-scope name collision, problem 3 above. The typecheck fix did not need
   `"moduleDetection": "force"`, because the specimens on master do not clash. Generated specimens still
   need a fix.

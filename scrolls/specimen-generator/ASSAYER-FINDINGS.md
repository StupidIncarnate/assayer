# Specimen generator: what generated specimens found wrong in Assayer

Generated specimens exist to catch Assayer bugs. This file lists the disagreements found so far between a
generated specimen's predicted outcome and Assayer's real output, and the decision on each.

They come from two runs of the first prototype against master at commit `fc1b4d9`, on 2026-10-08. The
second run generated 72 specimens with 146 tests: 106 passed and 40 failed. Every failure traces to one of
the causes below. No prediction rule was changed to match Assayer's output, because copying Assayer's
answers into the predictions would break rule P4: an expected value never comes from the code under test.

The second prototype has not run against Assayer yet. Its specimens are new shapes, so they may find more.

## The disagreements

| Cause | What Assayer does | What the specimen predicted | Decision |
|---|---|---|---|
| A | A private helper's `return` is missing from the caller's path. The path holds only the entry's `return` | The path holds the helper's `return`, then the entry's | **Assayer changes.** Assayer records every point where a value is produced and handed on, called an inline exit. A helper's `return` is one. A ternary whose result is assigned to a variable is another. Assayer can then follow a value back up the chain |
| B | The values `.at` needs for its index are lost through a passthrough function. Assayer tries only one placeholder value | The index gets the same values it gets with no passthrough | **Assayer changes.** Assayer carries a callee's value demands back to the caller's parameters |
| C | A plain index into a fixed array, `[10, 20, 30].at(index)`, gets `0`, `-1` and `7`, as if the length were unknown | Indexes from 0 up to the known length | **Assayer changes.** Assayer uses a known length for a plain index too, the way it already does for `[10, 20, 30].at(x.length)` |
| D | `.length` of one unknown array used as an index into another: Assayer tries an empty, a one-item and a two-item version of each array, crossed, for 9 cases | No agreed prediction | **Open.** Nobody has decided what Assayer should do |
| E | A dead arm at module scope after an `if` whose `else` falls through is reported nowhere | An `unreachable-exit` lint on the dead arm, as the same code gets inside a function | **Assayer changes.** Catching cases like this is why the matrix exists |
| F | A `string` parameter gets one value only, `'abc123'`. In `[10, 20, 30].at(text.length)` the index is always 6, so the in-range outcome is never tested | Several strings, such as `''`, `'a'` and `'abc123'` | **Needs a decision.** Should Assayer try more than one string, and which ones? |
| G | An undriven branch inside a private helper is reported nowhere. The file has no cases and no admissions, so it looks clean while nothing in it was tested | One undriven admission | **Needs a decision.** It looks like an Assayer gap, and it is a silent false success |

Causes A and B are both about calls. The call layer in `CALLABLES.md` generates exactly the specimens that
cover them.

## Smaller open questions about Assayer

| Question | Why it matters |
|---|---|
| What should `[10, 20, 30].at(3)` report, where the index is always past the end: an unreachable lint, or a P1 build error? | A specimen predicts one of the two |
| Assayer words the `unreachable-exit` lint differently for a variable locked to one value, an array locked to a fixed length, and a condition made only of literals | A generated test asserts the exact text, so the generator needs one wording per case |
| Does adding `export {};` to a module-level specimen change Assayer's analysis? | Without it, two generated module-level specimens that declare the same name clash in TypeScript |
| Does Assayer treat a getter, a setter, a static field and a generator as entries? | The second prototype generates all four. A missing one is either a dark spot or an Assayer fix |

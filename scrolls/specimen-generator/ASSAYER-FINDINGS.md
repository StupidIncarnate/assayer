# Specimen generator: what generated specimens found wrong in Assayer

Generated specimens exist to catch Assayer bugs. This file lists the disagreements found so far between a
generated specimen's predicted outcome and Assayer's real output, and the decision on each.

The causes A to G come from two runs of the first prototype against master at commit `fc1b4d9`, on 2026-10-08. The
second run generated 72 specimens with 146 tests: 106 passed and 40 failed. Every failure traces to one of
the causes below. No prediction rule was changed to match Assayer's output, because copying Assayer's
answers into the predictions would break rule P4: an expected value never comes from the code under test.

The committed generator, `packages/specimen-generator`, has also run against Assayer. `TRIAGE-1.md` sorts
the failures of its first run into causes and records the decision on each. This file lists only what is
still open. Causes A, B, C, D, F and G were not worked in this slice. A and B belong to the call layer.

## The disagreements

| Cause | What Assayer does | What the specimen predicted | Decision |
|---|---|---|---|
| A | A private helper's `return` is missing from the caller's path. The path holds only the entry's `return` | The path holds the helper's `return`, then the entry's | **Assayer changes.** Assayer records every point where a value is produced and handed on, called an inline exit. A helper's `return` is one. A ternary whose result is assigned to a variable is another. Assayer can then follow a value back up the chain |
| B | The values `.at` needs for its index are lost through a passthrough function. Assayer tries only one placeholder value | The index gets the same values it gets with no passthrough | **Assayer changes.** Assayer carries a callee's value demands back to the caller's parameters |
| C | A plain index into a fixed array, `[10, 20, 30].at(index)`, gets `0`, `-1` and `7`, as if the length were unknown | Indexes from 0 up to the known length | **Assayer changes.** Assayer uses a known length for a plain index too, the way it already does for `[10, 20, 30].at(x.length)` |
| D | `.length` of one unknown array used as an index into another: Assayer tries an empty, a one-item and a two-item version of each array, crossed, for 9 cases | No agreed prediction | **Open.** Nobody has decided what Assayer should do |
| F | A `string` parameter gets one value only, `'abc123'`. In `[10, 20, 30].at(text.length)` the index is always 6, so the in-range outcome is never tested | Several strings, such as `''`, `'a'` and `'abc123'` | **Needs a decision.** Should Assayer try more than one string, and which ones? |
| G | An undriven branch inside a private helper is reported nowhere. The file has no cases and no admissions, so it looks clean while nothing in it was tested | One undriven admission | **Needs a decision.** It looks like an Assayer gap, and it is a silent false success |

Causes A and B are both about calls. The call layer in `CALLABLES.md` generates exactly the specimens that
cover them.

## Open items found by the committed generator

Each row is a disagreement that is still open in Assayer. "Assayer changes" means the decision is made and
the fix is not built. "Needs a decision" means a human has not yet said what Assayer should do.

| Item | What Assayer does | What the specimen predicts | Decision |
|---|---|---|---|
| A `switch` case welded dead that ends in `break` | Assayer lints a dead arm that falls through for an `if`. It reports nothing for a dead `switch` case that ends in `break` | An `unreachable-exit` lint on the dead case | **Assayer changes.** The same rule as an `if` arm applies |
| A `process.env` read inside a function body | Assayer drives an environment read only when it runs as the module loads. A read inside a function body is not driven | Driven both ways, because a test can set the variable before the call | **Assayer changes** |
| A constructor value that a harness supplies | The value is not carried into the instances that the constructor builds | The instance sees the supplied value | **Assayer changes** |
| A required destructured property with a default | Assayer fills the property, so its default never runs | The default runs when the caller leaves the property out | **Needs a decision.** The case model has to say when a caller leaves a required property out |
| A default-value ternary beside a return ternary on the same condition in one function | Both ternaries get one coverage ID, so Assayer treats them as one branch | Two branches | **Assayer changes.** Each ternary needs its own ID |
| `harness-realize` and `compose-cross-file-predicates` | Assayer derives cases without the arms that fall through | A case for each arm that falls through | **Assayer changes** |

## Smaller open questions about Assayer

| Question | Why it matters |
|---|---|
| What should `[10, 20, 30].at(3)` report, where the index is always past the end: an unreachable lint, or a P1 build error? | A specimen predicts one of the two |
| Assayer words the `unreachable-exit` lint differently for a variable locked to one value, an array locked to a fixed length, and a condition made only of literals | A generated test asserts the rule and the line today. Asserting the exact text needs one wording per case |
| Does adding `export {};` to a module-level specimen change Assayer's analysis? | Without it, two generated module-level specimens that declare the same name clash in TypeScript |

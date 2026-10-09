# Triage of the first generated-specimen run

This file sorts every failure from the first run of the generated specimen tests into causes. For each
cause it says who is wrong: Assayer, the generator's prediction, or the test harness that reads Assayer's
output. Nothing here has been fixed yet. Step 10 of `IMPLEMENTATION.md` says the user decides each cause.

## The run this file reads

- The run stopped for lack of memory after 587 of the 1,169 test files. 53 passed and 534 failed.
- Its log is `generated-run-1.log` in the session scratchpad. It holds Jest's diff of the predicted
  `SpecimenOutcome` against the observed one for every failure.
- For each failure, the expected object was read from the `.test.ts` file. The received object was rebuilt
  from the diff. Every one of the 534 parsed cleanly.
- Every failing specimen was also run through `fileWalkBroker` plus `analyzeFileBroker` in a probe script,
  so each cluster below cites the analysis's own words (its undriven reasons, dark spot kinds, lint
  messages). A handful were also run through `runUnitBroker` to see each case's status and trace.

Terms used below:

- **Prediction**: the expected `SpecimenOutcome`, written by `specimen-predict-transformer.ts` from the
  generator's configs alone.
- **Observation**: the received `SpecimenOutcome`, built by `specimen-observe-broker.ts` and
  `specimen-outcome-projection-transformer.ts` from Assayer's real analysis and run.
- **Focus**: the one `if` or ternary a specimen exists to show.
- **Leaf**: a value inside the focus's condition. Its provenance (`param`, `const`, `env`, `external`)
  decides whether a test can set it.
- **Locked**: every leaf is a known constant, so the branch can only go one way.
- **Truthiness test**: a condition that is not a comparison, such as `if (receiver.length)` or
  `if (value ?? 0)`. JavaScript treats `0`, `''`, `false`, `null` and `undefined` as false.

## Summary

One failing specimen can have more than one cause, so the counts add up to more than 534. "Touched" is
every failing specimen the cause appears in. "Alone" is how many specimens pass once that one cause is
fixed, with no other fix.

| # | Cluster | Touched | Alone | Who is wrong | One-line fix |
|---|---|---|---|---|---|
| 1 | Undriven admission sits on the branch line, not the scope's first line | 116 | 74 | Generator | Predict the branch's line for a named entry. Keep the scope's line only for a whole-scope admission |
| 2 | Truthiness of `??` and of `.length` is not read | 110 | 106 | Assayer | Read a bare `x.length` as a length test and `a ?? b` as a nullish test, in the condition reader |
| 3 | A ternary outside `return` is a dark spot | 146 | 80 | Assayer (honest but incomplete) | Extend the value-and-exit reader to field initializers, call arguments, `yield`, object properties and exported `const` |
| 4 | The generator's own `T \| undefined` leaf ternary is a dark spot | 78 | 4 | Assayer, same family as 3 | Read a ternary that sits inside a condition or a `const` initializer. Fixing 3 likely covers it |
| 5 | Members of an exported object literal are linted as dead surface | 88 | 79 | Assayer | Treat a function stored in an exported object as reachable, and resolve it through the object |
| 6 | A ternary in a default parameter value is dropped silently | 33 | 32 | Assayer | `handle-function` must descend into parameter initializers |
| 7 | A static method or a getter cannot be called by the runner | 13 | 13 | Assayer | Carry `static` and accessor kind on the entry's access, and resolve each one correctly |
| 8 | A constructor is reported as a gap that "needs a harness" | 32 | 0 | Assayer | Drive `new Class()` the way methods already do. No harness could pay this gap |
| 9 | An async function's case never sees its exit | 5 | 5 | Assayer | Await the entry's result when it is a promise |
| 10 | A generator function's case never sees its exit | 32 | 0 | Assayer | Run the generator to completion when the entry returns an iterator |
| 11 | A dead arm that falls through is never linted | 10 | 0 | Known: cause E | Already decided in `ASSAYER-FINDINGS.md`: Assayer reports a dead arm in every scope |
| 12 | A module-level branch with converging arms is observed one way | 4 | 2 | Generator | Predict `one-way` when the arms fall through to one shared exit |
| 13 | The observation lists only branches of entries | 10 | 0 | Harness | Take the branch list from the walk's scopes, not from `analysis.functions` |
| 14 | The run directory name is too long for the file system | 1 | 1 | Harness | Derive the run id through `runIdBroker`, not from the joined path |
| 15 | `value === 7` on a number parameter is undriven | 4 | 2 | Assayer | The violating arm must not fall back to the number representative, which is also 7 |

## What already works

The 53 passing specimens show these shapes work end to end:

- **Locked specimens with a plain comparison.** 40 of the passes. A same-file `const` compared with `===`,
  `>` or `!`, or used bare as a boolean, inside a function declaration, an arrow function (block or
  concise body), a function expression, a default export, or an instance method. Assayer drives the live
  arm, and its `unreachable-exit` lint lands on the predicted line.
- **Driven specimens.** 5 of the passes. A `boolean` or `number` parameter compared with `=== false`, `>`
  or `!`, in a concise arrow body or a function declaration.
- **Undriven specimens in a concise arrow body.** 8 of the passes. These pass only because the branch and
  the arrow start on the same line, so cluster 1's two rules give the same answer.

## 1. The undriven admission sits on the branch line (generator wrong)

**Count:** 116 touched, 74 alone.

**Examples:**

- `if-boolean-arrow-function-block-body-cond-eq-boolean-value-external`: predicted undriven
  `[{startLine: 1}]`, observed `[{startLine: 2}]`.
- `ternary-boolean-class-method-cond-*-external`: predicted line 2 (the method), observed line 3 (the
  ternary).
- `if-*-async-function-*-external`: predicted line 1, observed line 3. The `if` follows an `await` line.

**What Assayer does.** A named entry whose branch cannot be steered gets one admission per branch, on the
branch's own line. Assayer uses the scope's first line only when it admits a whole scope: a module with no
case at all, or an inline function nothing can steer (an IIFE starts at its own line).

**Evidence that this is the documented design:**

- `packages/core/src/brokers/analyze/file/analyze-file-broker.ts:186-187`: "A NAMED entry the projection
  never claims keeps its per-branch admissions — an opaque `if (g())` or a non-param local `if (u > 5)`
  names the branch a case cannot steer."
- `analyze-file-broker.ts:192` (`whollyUndrivenModules`) and `:217` (`branchUndriven`) are the two
  channels.
- `packages/core/CLAUDE.md` section 5.12: "Either question failing means the branch is admitted as
  undriven."

**Where the generator goes wrong.** `IMPLEMENTATION.md:84` states the rule as "at the start line of the
scope that holds the focus". `specimen-predict-transformer.ts:133-134` implements it with
`focus.getFirstAncestor(...)`.

**Corrected rule.** When a leaf is `external`:

- If the focus sits in a function-like that is an entry, predict the focus's own line.
- If the focus sits at module level and the module earns no case at all, predict line 1.
- If the focus sits in an inline function that nothing calls by name (an IIFE), predict that function's
  start line.

## 2. Truthiness of `??` and of `.length` is not read (Assayer wrong)

**Count:** 110 touched, 106 alone. These are every `const` and `param` specimen whose condition is
`value ?? 0`, `value ?? false`, `receiver.length` or `text.length`, outside the containers that fail for
other reasons first.

**Examples:**

- `if-number-function-declaration-body-cond-array-length-number-receiver-const`. The source is
  `const receiver = [10, 20, 30]; … if (receiver.length)`. Predicted `if` one-way, plus an
  `unreachable-exit` lint on line 7. Observed `never`, no lint, and undriven on line 4 with the reason
  "whose deciding value `receiver.length` is neither one of its parameters nor an environment variable".
- `if-number-function-declaration-body-cond-nullish-number-value-param`. The source is
  `(value: number | undefined) … if (value ?? 0)`. Predicted both ways. Observed `never`, with the reason
  "compares `value` against a value Assayer could not read as a literal". There is no comparison in that
  condition, and `0` is a literal.
- `ternary-number-arrow-function-block-body-cond-array-length-number-receiver-param`. A parameter array's
  `.length` reads as "neither one of its parameters". `receiver` is a parameter.

**Why this is Assayer contradicting its own design:**

- `packages/core/CLAUDE.md:350`: "A `.length` guard on an array does record a length predicate."
  `CLAUDE.md:379` names `operandConstLength` as the weld for a `const` array's length.
- `packages/core/CLAUDE.md:884` names the "`??`/`?.` non-nullishness check" as part of the condition lens.
- `is-predicate-constraining-guard.ts` already says a truthy or falsy read constrains a value.

**The code responsible:**

- `packages/core/src/transformers/walk-file/read-condition-layer-transformer.ts:55`. `isLengthAccess` is set
  only when the condition is a binary comparison. A bare `receiver.length` falls through to an
  object-member read (`operandPropertyPath: ['length']`), which is unsteerable by design.
- `packages/core/src/transformers/walk-file/read-condition-tree-layer-transformer.ts:80`. The tree reader
  splits only `&&` and `||`. A `??` in an `if` condition becomes one leaf with operator `??`. The predicate
  reader cannot classify it, so the branch is admitted with the "could not read as a literal" reason.

**Fix.** Read a bare `x.length` condition as the length test `x.length !== 0`. Read `a ?? b` in a
condition the way `read-nullish-leaf` already reads it in a value position, plus a truthiness test on
each side. Then the same-file `const` cases weld, and the parameter cases drive. Add a hand-written
specimen first, per `packages/core/CLAUDE.md` section 6.

## 3. A ternary outside `return` is a dark spot (Assayer, honest but incomplete)

**Count:** 146 touched, 80 alone.

**Where it happens.** The focus ternary is a dark spot of kind `ConditionalExpression` whenever it is not
in a `return`, a `throw`, or a concise arrow body:

| Container and slot | Example source |
|---|---|
| `class` field and static field | `public label = cond ? 'then' : 'else';` |
| `class` constructor body, `module` statement | `console.log(cond ? 'then' : 'else');` |
| `generator-function` body | `yield cond ? 'then' : 'else';` |
| `module` exported const | `export const x = cond ? 'then' : 'else';` |
| `object-literal` property | `label: cond ? 'then' : 'else',` |

**Example diff** (`ternary-boolean-class-field-cond-eq-number-value-const`): predicted branch
`{ternary, line 4, one-way}` and an `unreachable-exit` lint on line 4. Observed no branch, no lint, and
`darkSpots: [{startLine: 4}]`.

**Who is wrong.** Assayer reports this through the right channel. A dark spot is Assayer's own debt, and
it does not hide the syntax. But `packages/core/CLAUDE.md:879` says the value-and-exit reader handles a
conditional expression "in EVERY value position alike", and then lists only four positions: a `return`, a
`throw`, a concise arrow body, and a `const` that flows into a `return`. Field initializers, call
arguments, `yield`, object properties and exported `const` values are value positions, and the reader
does not reach them. The ternary kind is listed in
`packages/core/src/statics/significant-syntax-kinds/significant-syntax-kinds-statics.ts:15`, which is why
it becomes a dark spot rather than vanishing.

**Fix.** Extend the reader in section 5.12 to each of these positions. Each position needs a decision
about what its "exit" is: a field's value, a logged argument, a yielded value. That decision is also
what cause A in `ASSAYER-FINDINGS.md` asks for ("inline exits").

**Open decision.** `IMPLEMENTATION.md:85` says "Every syntax in the first matrix is one Assayer claims to
handle". The docs do not list these positions as handled or as unhandled. I recommend keeping the
prediction and treating each position as Assayer work, because this is exactly what the matrix exists to
find. The alternative is to predict a dark spot here until each position lands, but only if the docs
first declare those positions unhandled. Otherwise the prediction would copy Assayer's output, which rule
P4 forbids.

## 4. The generator's own `T | undefined` leaf ternary is a dark spot (Assayer, same family as 3)

**Count:** 78 touched, 4 alone. Almost all of them also carry cluster 1 or 3.

**What happens.** For a nullish specimen, the generator writes the leaf as a ternary, for example
`(process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false`. For an `env`
specimen, it writes `const value = process.env.VALUE === undefined ? undefined : process.env.VALUE ===
'true';`. Assayer reports that inner ternary as a dark spot, so the predicted leaf branch is missing.

**Examples:**

- `ternary-boolean-arrow-function-expression-body-cond-nullish-boolean-value-external`: predicted two
  ternaries on line 1, both `never`. Observed one ternary and `darkSpots: [{startLine: 1}]`.
- `if-boolean-module-statement-cond-nullish-boolean-value-env`: predicted the leaf ternary on line 1 and
  the `if` on line 3, both driven both ways. Observed a dark spot on line 1, the `if` one-way, and an
  undriven admission on line 3 ("deciding value `value` is neither one of its parameters nor an
  environment variable").

**Who is wrong.** Assayer, for the same reason as cluster 3. A ternary that is an operand inside a
condition, or a `const` initializer that does not flow into a `return`, is in no lens.

**Fix.** The cluster 3 fix should cover the `const` initializer. The ternary inside a condition needs the
condition reader to read a ternary operand. Once both land, the `external` leaves should be undriven, as
predicted.

**Open decision about `env` booleans.** `packages/core/CLAUDE.md:833` says
"`process.env.NODE_ENV === 'production'` is NOT driven". The environment feature reaches only one hop,
through `Number(process.env.X)`. The generator predicts both ways for every `env` leaf, including the
boolean ones written as `process.env.X === 'true'`. The probe confirms Assayer leaves those undriven, for
example `if-boolean-iife-cond-env`, which this run did not reach. Either the generator predicts `never`
plus undriven for a boolean `env` leaf, which the docs support, or the user widens the environment
feature. This is a scope decision, so it is the user's.

## 5. Members of an exported object literal are linted as dead surface (Assayer wrong)

**Count:** 88 touched, 79 alone. Every `object-literal` specimen in the `arrow-property` and `method`
slots.

**Example** (`if-boolean-object-literal-arrow-property-cond-eq-number-value-const`): predicted branch
`{if, line 5, one-way}` and an `unreachable-exit` lint on line 6. Observed no branch, and
`{rule: 'dead-surface', startLine: 4}` with the message "nothing in this file calls it, so it is dead
surface: an unexported helper is reachable only from its own file".

**Why this is wrong.** The function is stored in an exported object, so any importer can call it. Root
`CLAUDE.md:624` defines dead surface as a private function nothing uses "whether by calling it or by
passing it anywhere". Exporting it is passing it somewhere.

**The code responsible:**

- `packages/core/src/transformers/walk-file/read-entry-access-layer-transformer.ts:68-71`. A function-like
  whose own declaration is not in the module's export table is `unreachable`. An arrow or method inside an
  exported object literal has no export of its own.
- `packages/core/src/transformers/follow-calls/follow-calls-transformer.ts:519` then raises the
  dead-surface lint, because nothing in the file calls it.

**Fix.** Give an entry a new access kind for "property of an exported object": the export name plus the
property name. Then teach `case-resolve-entry-broker.ts` to read `subject[exportName][property]` and call
it with the object bound as `this`.

## 6. A ternary in a default parameter value is dropped silently (Assayer wrong)

**Count:** 33 touched, 32 alone. Every `function-declaration` specimen in the `default-param` slot.

**Example** (`ternary-boolean-function-declaration-default-param-cond-const`): predicted branch
`{ternary, line 3, one-way}` plus an `unreachable-exit` lint. Observed nothing at all. There is no
branch, no dark spot, no undriven admission and no lint. The probe shows the entry with zero branches
and three cases, which come from the array parameter's empty, one-item and many-item versions.

**Why this is wrong.** `packages/core/CLAUDE.md:679` (section 5.6): "Unrecognized does not mean
invisible." Assayer understood neither the ternary nor that it missed it, and the file reads as clean.
This is the worst kind of miss, because nothing tells the reader to look.

**The code responsible.** `packages/core/src/transformers/walk-file/handle-function-layer-transformer.ts:289-296`.
The handler's descents are only the body. It never descends into a parameter's initializer, so the walk
never sees the ternary, and the dispatcher's dark-spot fallback never runs.

**Fix.** Descend into every parameter initializer under the function's own context. A ternary there then
at least becomes a dark spot. Reading it as a real branch also needs a decision about the case model,
because the branch runs only when the caller leaves that argument out.

## 7. A static method or a getter cannot be called by the runner (Assayer wrong)

**Count:** 13 touched, 13 alone. The `class` `static-method` and `getter` specimens whose condition
Assayer otherwise drives.

**Example** (`if-boolean-class-static-method-cond-eq-boolean-value-const`): predicted `{if, line 5,
one-way}` and no case failures. Observed `never`, and a case errored with "entry 'run' is not an
exported function — nothing to drive". A getter errors the same way: "entry 'result' is not an exported
function".

**Why this is wrong.** The analysis makes these entries and derives cases for them. The runner then
cannot call them, so the analysis promises a test the run cannot perform.

**The code responsible:**

- `packages/core/src/transformers/walk-file/read-entry-access-layer-transformer.ts:48`. Methods, getters
  and setters all become `{kind: 'method', className, constructable}`. Nothing records `static` or the
  accessor kind.
- `packages/core/src/brokers/case/resolve-entry/case-resolve-entry-broker.ts:75-76`. It always builds an
  instance and reads `instance[name]`. A static method is not on the instance. A getter's value is a
  string, not a function. Reading the getter here also runs its body before the case's probe is reset.

**Fix.** Add `static: true` and `accessor: 'get' | 'set'` to the method access. Resolve a static method
from the class itself. Wrap a getter as a function that reads the property when the case runs.

## 8. A constructor is reported as a gap that "needs a harness" (Assayer wrong)

**Count:** 32 touched, 0 alone. Every `class` `constructor-body` specimen. Each also has cluster 3, 11
or 1.

**Example** (`if-boolean-class-constructor-body-cond-eq-boolean-value-const`): observed
`gaps: [{name: 'constructor'}]`. The run's reason is "a constructor is reached through `new`, which the
runner does not drive — needs a harness". No case runs, so the `if` reads `never`.

**Why this is wrong:**

- Root `CLAUDE.md:610` defines a gap as the caller's debt that "A harness pays this off". A harness can
  only supply values under `inputs.<entry>.<param>`. These constructors take no parameters, so no
  harness can pay this gap. The root `CLAUDE.md` forbids an admission that gives advice the reader cannot
  act on.
- The runner already builds instances: `case-resolve-entry-broker.ts:75` calls
  `Reflect.construct(owner, [])` for every instance method. Running the constructor is that same call.

**The code responsible.** `packages/core/src/transformers/case-set-projection/case-set-projection-transformer.ts:73-75`
blocks every `constructor` entry, and `:112` writes the reason.

**Fix.** Resolve a `constructor` entry to `(...args) => Reflect.construct(owner, args)`, and stop
blocking it. Keep the gap only for a constructor that needs an argument no value can be built for. That
is a real input gap, and the input-gap channel already reports it.

## 9. An async function's case never sees its exit (Assayer wrong)

**Count:** 5 touched, 5 alone. The `async-function` specimens whose branch Assayer drives.

**Example** (`ternary-boolean-async-function-cond-eq-boolean-value-const`): the source is
`await Promise.resolve(); return value === false ? 'then' : 'else';`. Observed a case errored with
"reached no exit in 'ternaryBooleanAsyncFunctionCondEqBooleanValueConst'", so the ternary reads `never`.

**Why this is wrong.** The analysis predicts the `return` after the `await` as the case's exit. The
interpreter then refuses to wait for it.

**The code responsible.** `packages/core/src/brokers/case/interpret/case-interpret-broker.ts:174-180`. It
awaits only a module entry. The comment says "an async function's later work is not part of the exit
the case predicts", and these specimens show it is.

**Fix.** Await the result whenever the entry returns a promise, then read the probe events.

## 10. A generator function's case never sees its exit (Assayer wrong)

**Count:** 32 touched, 0 alone. Every `generator-function` specimen. Each also carries cluster 3, 11 or 1.

**Example** (`if-boolean-generator-function-cond-eq-boolean-value-const`): a case errored with "reached no
exit in 'ifBooleanGeneratorFunctionCondEqBooleanValueConst'".

**Why this is wrong.** Calling a generator function only creates an iterator. Its body runs when
something iterates it. The analysis predicts the body's end as the exit, and nothing runs the body.

**The code responsible.** `case-interpret-broker.ts:172`. `Reflect.apply(entry, …)` creates the iterator
and drops it.

**Fix.** When the result is an iterator, iterate it to the end, then read the probe events.

## 11. A dead arm that falls through is never linted (known: cause E)

**Count:** 10 touched, 0 alone. `if` focus, locked, where the arms log or yield instead of returning:
the `class` constructor body and the `generator-function` body.

**Example** (`if-boolean-generator-function-cond-eq-boolean-value-const`): predicted
`{rule: 'unreachable-exit', startLine: 5}` on `yield 'then'`. The probe's analysis has no lint at all.

**Status.** This is cause E in `ASSAYER-FINDINGS.md`, which records the decision "Assayer changes". Cause E
was found at module scope, and these specimens show it in function scopes too. The arm does not end the
function, so it is not an exit, and the `unreachable-exit` rule never sees it.

## 12. A module-level branch with converging arms is observed one way (generator wrong)

**Count:** 4 touched, 2 alone. `if-*-module-statement-*-external`.

**Example** (`if-number-module-statement-cond-array-length-number-receiver-external`): predicted
`{if, line 1, never}`. Observed `one-way`. The run has one passed case for `*module*`, which reaches
`*module*/exit@top`, and its trace holds the condition's outcome `false`.

**What is happening.** Both arms log and then fall through to the same end of the module. Every input
reaches the one exit, so Assayer derives one case for it, which is sound. Running that case loads the
module, and loading the module evaluates the branch once. The branch is still admitted as undriven,
which matches the prediction.

**Where the generator goes wrong.** `specimen-predict-transformer.ts:80` maps every `undriven` verdict to
`never`. The rule assumes no case evaluates the focus, and that only holds when the arms lead to
different exits.

**The docs are silent** on whether converging arms still earn a case. The nearest sentence,
`case-set-projection-transformer.ts:15-16` ("A module whose branch turns on an OPAQUE operand earns no
case at all"), is broader than what the code does. I recommend predicting `one-way` whenever the
verdict is `undriven` and the arms fall through, which `fallsThrough` on line 114 already computes. The
reason is that `packages/core/CLAUDE.md` section 5.13 derives one case per distinct exit, and converging
arms share one exit. This also applies to a constructor or generator once clusters 8 and 10 are fixed.
The user should confirm. Then fix the sentence in `case-set-projection-transformer.ts` either way.

## 13. The observation lists only branches of entries (harness wrong)

**Count:** 10 touched, 0 alone. The `iife` specimens Assayer admits as undriven.

**Example** (`if-boolean-iife-cond-nullish-boolean-value-external`): predicted the `if` on line 2 as
`never`. The observation lists no branches at all. The analysis admits the IIFE as undriven, so the IIFE
is not one of `analysis.functions`, and its branch has nowhere to appear.

**The code responsible.** `packages/specimen-generator/src/transformers/specimen-outcome-projection/specimen-outcome-projection-transformer.ts:40`
reads branches only from `analysis.functions`. `IMPLEMENTATION.md` defines the field as "one row per
branch in the file's analysis", and a branch inside an undriven or dead scope is still in the file.

**Fix.** Have `specimen-observe-broker.ts` pass `walked.scopes` to the projection, and take the branch
list from every scope's `branches`. Those share the `BranchNode` contract, so the leaf-ID matching is
unchanged. Without this fix, every undriven inline function and every dead private reads as having no
branch.

**A related wording bug in Assayer.** The IIFE admissions use the fixed reason in
`packages/core/src/transformers/follow-calls/follow-calls-transformer.ts:87-92`: "invoked in place with
an argument no case can resolve … the value its parameter binds to". These IIFEs take no argument and
have no parameter. The real cause is the condition: cluster 2 for the `const` ones, and the external
read for the rest. The error does not name what is wrong, which root `CLAUDE.md` calls a bug.

## 14. The run directory name is too long (harness wrong)

**Count:** 1.
`ternary-number-function-declaration-default-param-cond-array-length-boolean-receiver-external` threw
`ENAMETOOLONG: name too long, mkdir '/tmp/assayer-specimen-observe-…/runs/packages__syntax-repository__src__ternary__…'`.

**The code responsible.** `packages/specimen-generator/src/brokers/specimen/observe/specimen-observe-broker.ts:51`
builds the run id as `relPath.replaceAll('/', '__')`. The folder name appears twice in the path, so a
long specimen name goes past the file system's 255-byte limit for one name. `run-unit-broker.ts:134`
makes that directory.

**Fix.** Derive the run id through core's own `runIdBroker` (`packages/core/src/brokers/run/id/`),
which is the one place that names a run. Or hash the path.

## 15. `value === 7` on a number parameter is undriven (Assayer wrong)

**Count:** 4 touched, 2 alone. Every `eq-number` specimen with a parameter leaf.

**Example** (`if-boolean-function-declaration-body-cond-eq-number-value-param`): the source is
`(value: number) … if (value === 7)`. Predicted both ways. Observed `never`, with the reason "compares
`value` against a value Assayer could not read as a literal". A probe shows `value === 3` drives both
ways and `value === 7` does not.

**The code responsible.** `packages/core/src/guards/is-predicate-constraining/is-predicate-constraining-guard.ts:88-95`.
The violating arm of `=== 7` names no value of its own, so it falls back to the type's representative.
`packages/core/src/statics/representative-value/representative-value-statics.ts:13` sets that to `7`.
Both arms then hold 7, so the guard decides the comparison does not split the inputs. Line 40 of the
guard records the same collision already fixed for `b === false`.

**Fix.** Give the `eq` predicate's violating arm a value that differs from the literal, in
`type-to-range`, the way the boolean fix did. The undriven wording is also wrong here, because the
literal was read.

## Open questions for the user

1. **Cluster 3:** keep the "no dark spots" prediction and treat each value position as Assayer work
   (recommended), or document the positions as unhandled and predict dark spots until each one lands?
2. **Cluster 4, `env` booleans:** predict undriven for `process.env.X === 'true'`, which the documented
   one-hop limit supports, or widen the environment feature?
3. **Cluster 12:** confirm that converging arms predict `one-way`.
4. **Cluster 6:** what a default parameter's ternary should drive, once the walk reaches it.
5. **Memory:** the full run cannot finish on this machine even at 4 workers. The remaining 582 specimens
   need sharded runs, for example one container per command, before the second triage.

## Decisions on this triage, 2026-10-09

The orchestrator decided each open point, so the work can continue. The user reviews them with the
finished slice.

| Point | Decision |
|---|---|
| Clusters 1, 12, 13, 14 | The generator and the observe harness change, as recommended |
| Clusters 2, 5, 6, 7, 8, 9, 10, 15 | Assayer changes, as recommended |
| Cluster 3 and 4 | The generator keeps predicting no dark spots. Each value position a ternary can sit in is Assayer work: field initializers, call arguments, `yield`, object properties, exported consts, conditions and `const` initializers |
| Cluster 11 | Assayer changes, as cause E already decided |
| Cluster 12 | A module-level branch whose arms both fall through, in an undriven scope, is predicted `one-way`. Loading the module runs the branch once with the values the test process has |
| `env` booleans | The generator keeps predicting both ways. A value read from `process.env` is an input a test sets, so Assayer widens its environment driving to string comparisons |
| Cluster 6 | Once the walk reaches a default parameter's ternary, the ternary is a branch of its function, driven by the function's own parameters |
| Hand-written specimens | A generated specimen that catches an Assayer bug is the regression specimen for its fix. No extra hand-written specimen is required. A hand-written specimen's test that a fix changes is updated by reading the code, never by copying Assayer's new output |
| Running the generated suite | Never the whole suite in one command on this machine. One folder at a time, such as `npm run test:generated -- if/class` |

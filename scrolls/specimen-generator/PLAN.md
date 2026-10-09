# Specimen generator: the plan

This folder plans a generator that writes Assayer's specimens, plus a test for each one. A specimen is a
small example file under `smoke-repo/packages/syntax-repository/src` that shows one syntax pattern Assayer
claims to handle. Today a human writes each specimen and its test by hand, and there are far fewer of them
than the patterns Assayer has to handle.

Start here. This file says what is decided, what is built, what is open, and what the next session should
plan first.

## Files in this folder

Read them in this order:

| File | What it holds |
|---|---|
| `PLAN.md` | This file: the direction, the decisions, the open questions, the next steps |
| `IMPLEMENTATION.md` | The build plan for the first slice: every file in order, and the rules every implementing agent follows |
| `PROTOTYPE-2.md` | The superseded prototype: the config files as it wrote them, the specimens they produce, how to run it, and the review page |
| `CONTAINERS.md` | Containers as templates with typed slots, and what each kind of slot accepts |
| `SHIMS.md` | Shims: plain TypeScript stand-ins for builtins. Their rules, ranges, pinning, and the builtin inventory |
| `TRIAGE-1.md` | The first generated run sorted into causes, with the decision on each |
| `CALLABLES.md` | The call layer: made-up callables, one per signature shape, crossed with the call site. Not built |
| `STUBS.md` | The stub dimension: values from object properties, and human corrections. Not built |
| `LINT.md` | How far the config files are from the repo's lint and typecheck rules, measured |
| `ASSAYER-FINDINGS.md` | What generated specimens found wrong in Assayer, and the decision on each |
| `BACKLOG.md` | Building blocks still to declare |

## Where things stand

- **The direction below is agreed.** It was worked out with the user on 2026-10-08.
- **The first slice is built.** `IMPLEMENTATION.md` steps 1 to 9 are done. The hand-written catalogue lives
  in `manual-smoke-repo/`. `packages/specimen-generator` is a private workspace package. `npm run
  generate:specimens` writes `smoke-repo/`, and `npm run test:generated` runs its tests against Assayer.
  Ward's startup integration test fails when the committed output is stale.
- **The committed matrix is `if` and `ternary`.** It covers every container, depth 1, the type arguments
  `number` and `boolean`, and the provenances `param`, `env`, `literal`, `const` and `external`. An `env`
  read is not offered for an array hole.
- **Step 10 is recorded.** `TRIAGE-1.md` sorts the first run's failures into causes and records the decision
  on each. A second pass followed. Assayer fixes for most causes are built in core. `ASSAYER-FINDINGS.md`
  lists what is still open.
- **The generated suite runs one folder at a time on this machine.** For example, `npm run test:generated --
  if/class`. The whole suite in one command runs out of memory.
- **The prototype is superseded.** It lives in `tmp/specimen-generator-v2/`, which is git-ignored.
  `PROTOTYPE-2.md` is kept for its findings.
- **A review page shows each config file beside every specimen the prototype produced.** It is private to the
  user: https://claude.ai/code/artifact/3b754ead-3ae1-4907-9455-0dd94477d4c0.

## The direction

### Three kinds of declaration file

| Kind | What it declares | Example |
|---|---|---|
| Container | Real TypeScript with typed slots where code goes | `class.container.ts`: a class with method, getter, constructor, field and static slots |
| Syntax | One statement or one expression, as a typed arrow function whose parameters are its holes | `gt.syntax.ts`: `<T extends number \| string>(value: T, limit: T): boolean => value > limit` |
| Shim | One builtin, written from the spec as plain TypeScript, plus how a call to it is written | `array-at.shim.ts`: `Array.prototype.at` |

Three settings files sit beside them: the type list, the provenances, and the matrix settings.

### How the pieces fit

1. **A hole is filled by type.** Nobody lists which syntax may fill which hole. `gt` returns `boolean`, so
   it fills every `boolean` hole, including an `if` condition. The type checker reads each hole's type and
   each result type from the code.
2. **A syntax's body decides its kind.** A block body is a statement. It goes only in statement slots and
   never fills a hole. An expression body is an expression. A shim is always an expression, because it is
   written as a call.
3. **A declaration that works for any type is generic.** The generator makes one instance per type in
   `matrix.typeArguments`. A constraint narrows the list. An anchor on a generic hole gives one value per
   type.
4. **Exactly one leaf varies per specimen.** Every other leaf takes its anchor or the plainest fill its slot
   offers. Nesting stops at `matrix.depth`.
5. **A leaf's provenance decides the predicted outcome.**

   | Provenance | Writes | Predicts |
   |---|---|---|
   | `param`, `env` | a parameter, or a module-level read of `process.env` | driven |
   | `literal`, `const` | the value in the code | locked to one arm. The other arms are dead |
   | `random` | `Math.random()`, from a shim with a declared range | locked when the range decides the branch, otherwise driven by pinning |
   | `external` | `process.argv`, an input Assayer cannot set | undriven |
   | `prop`, planned | a property of an object parameter | from the stub view, in `STUBS.md` |

6. **Shims describe builtins.** A shim's result comes from its inputs, from a declared range, or from
   outside the program. Every base builtin gets a shim, and each shim is checked against the real builtin.
7. **TypeScript is the last judge of good code.** A generated file TypeScript rejects is not written. It is
   listed as refused, with TypeScript's reason.
8. **Predictions come from the configs alone.** They never come from running Assayer. Copying Assayer's
   output into a prediction would break rule P4: an expected value never comes from the code under test.

### Build order

Each layer is built on the one below it. A layer's specimens run against Assayer only after the layer
below passes.

| Layer | What it covers | Doc | State |
|---|---|---|---|
| 1. Syntax | What Assayer understands with no shim: operators, literals, and a value's internal state | `SHIMS.md`, "The floor" | Declared and generated |
| 2. Containers and syntax | Every syntax, in every container slot, from every provenance | `CONTAINERS.md` | Built in `packages/specimen-generator`, run against Assayer |
| 3. Calls | Made-up callables, one per signature shape, crossed with the call site | `CALLABLES.md` | Not built |
| 4. Shims | Each builtin as a callable built from syntax | `SHIMS.md` | Four shims declared. Written as calls, not yet as callees |

Two more dimensions cross these layers:

- **Stubs and corrections**, in `STUBS.md`.
- **Harness gaps:** the same specimen with and without a harness file.

As more gets declared, more provenances and props with special meaning will turn up. Each one is a row in a
settings file, with its own prediction rule.

### The loop

```mermaid
flowchart TD
  A["Config files (hand-written)"] --> B["Generate every legal combination"]
  B --> C["Predict each specimen's outcome<br/>from the configs alone"]
  C --> D["Write specimen and test into the smoke repo"]
  D --> E["Run the tests against Assayer"]
  E --> F{"Does Assayer match?"}
  F -- yes --> G["Done"]
  F -- "no: Assayer is wrong" --> H["Fix Assayer"]
  F -- "no: the config is wrong" --> I["Fix the config"]
  H --> E
  I --> B
```

- **A new behavior starts as a config change.** Add a syntax file and regenerate. Every specimen it reaches
  expects the new behavior and fails until Assayer handles it.
- **An Assayer change shows its full reach.** The generated tests that fail name every container, syntax and
  provenance the change touched.
- **When a generated test fails, a human decides which side is wrong.**

## Decisions

| Topic | Decision |
|---|---|
| Home | A private workspace package, `packages/specimen-generator`. A probe showed ward checks nothing outside a workspace package, so only a package gets the standards enforced. Declaration files sit in its `declarations/` folder, which lint skips and the generator typechecks itself |
| What a generated test asserts | Structure, plus a passing run. Each `if` and ternary driven both ways, one way or never; failed cases; lints by rule and line; undriven, dark spots and gaps. Never Assayer's input values. `IMPLEMENTATION.md` defines the shape |
| Smoke repos | The hand-written catalogue moves to `manual-smoke-repo/`. `smoke-repo/` holds only generated files |
| First committed matrix | `if` and `ternary`, every container, depth 1, type arguments `number` and `boolean`, no `random` provenance, no `.at` or `.includes` fills |
| Declaration files | Containers, syntax and shims, each one file exporting one named const. No default exports |
| How code is built | The generator parses each declaration's code with the TypeScript compiler and swaps syntax-tree nodes. It never edits text |
| Types | Read from the code by the type checker, never declared twice |
| Statement or expression | Decided by the node kind of a syntax's `code` body |
| Generics | One instance per allowed type argument |
| Branch prediction | The generator runs a syntax file's own `code` to find which arm known values reach. There is no separate `decide` prop |
| `.length` | A shim per receiver: `array-length` and `string-length`. It reads a value's internal state |
| Shim results | From the inputs, from a declared `range`, or from outside the program. A shim with inputs declares no range |
| Pinning | Assayer replaces a builtin's result inside one generated test with a value it chose, one per region of the range. It is a capability Assayer wraps, under rule R1 |
| Refusals | TypeScript's verdict on a generated file is final. Refused files are listed, never dropped silently |
| Specimen buckets | The `happy-path/` and `sad-path/` folders go away. Each specimen's clean or unclean verdict comes from its predictions. A generated manifest replaces `specimen-registry.ts` and the folder rule in `bucket-verdict.ts` |
| Complex entries | A specimen the grid cannot express is written by hand, with its expected results written by hand |
| Generated files | Committed, so `git diff` shows what a config change rewrote. A check fails if regenerating would change a committed file |
| A generated specimen that catches a bug | It is that bug's regression specimen. No extra hand-written specimen is required. `TRIAGE-1.md` records the decision |
| Running the generated suite | One folder per command, such as `npm run test:generated -- if/class` |
| Naming an exit in a test | By line, through `exitOnLine(n)`. The generator knows every line because it parses its own output |

## Open decisions, in the order planning needs them

| Decision | Why it comes first | Doc |
|---|---|---|
| How two settable values feed one check, as in `a > b`, and whether two leaves may vary at once | Anchored holes never vary today. So `value > limit` with two parameters, and a shim locked by two known inputs, are never generated | `CALLABLES.md` |
| Union type arguments, such as `number \| undefined` | Needed for `if (maybeCount)`, likely the most common `if` in real code | `BACKLOG.md` |
| Pinning: always on, or behind a global config toggle | A toggle would give both the driven and the undriven outcome from one specimen | `SHIMS.md` |
| Assayer causes D, F and G, and the open items listed after them | Each needs a decision before its specimens can predict anything | `ASSAYER-FINDINGS.md` |

Smaller open questions live in the doc each one belongs to.

## Sizes measured on 2026-10-08

| Run | Focus | Containers | Depth | Written | Refused by TypeScript |
|---|---|---|---|---|---|
| Full | `if`, `ternary` | all 10 | 1 | 3,311 | 250 |
| Small subset | `if`, `array-at`, `array-includes` | function-declaration, module | 1 | 957 | 39 |
| Depth 2 | `if` | function-declaration, module | 2 | 806 | 270 |

The base library holds 59 global values with about 1,000 members, from TypeScript's `lib.es2022.d.ts`.
`SHIMS.md` has the breakdown.

## Carrying over today's hand-written specimens

On 2026-10-08 the catalogue held 115 specimen source files and 118 test files. Each one gets one of two
destinations, recorded in a table in this folder:

1. **A generated specimen.** If none matches, the configs are missing a container, a syntax, a shim or a
   provenance, and that gets declared first.
2. **A complex entry**, only when the grid really cannot express it. Likely candidates are `harness/` and
   `input-gap/` (identical files that differ only by a harness file), `composition/`, and multi-file setups
   such as `env-object/`.

The hand-written originals are deleted only after every one has a destination, and both
`npm run test:syntax` and `npm run ward` pass.

## Next steps for the next session

1. **Decide the open Assayer items** in `ASSAYER-FINDINGS.md`: causes D, F and G, and the rows marked "needs
   a decision". Then build the rows marked "Assayer changes".
2. **Run the whole generated suite folder by folder,** and triage what the second pass has not covered.
3. **Then, each verified before the next:**
   1. widen the matrix: `string` (cause F), depth 2, and the `random` provenance once Assayer pins
   2. the call layer, with exit lines added to the observation (causes A and B)
   3. the shim inventory as a generated doc, and a shim check against the real engine for every shim
   4. the stub dimension
   5. the carry-over table, and retiring the hand-written specimens

# Specimen generator: implementation plan for the first slice

This file is the build plan for the first working slice of the generator. It lists every file to write, in
the order to write them, and the rules every implementing agent follows. `PLAN.md` holds the direction and
the open questions. This file holds only what gets built now.

**State.** The slice is built: steps 1 to 9 are done. Step 10's triage is recorded in `TRIAGE-1.md`, and a
second pass followed it. `ASSAYER-FINDINGS.md` lists what is still open.

## What the first slice delivers

At the end of this slice, four things are true:

1. **The hand-written catalogue lives in `manual-smoke-repo/`.** Every check that reads it today still reads
   it there: `test:syntax`, the specimen registry, the core integration tests, the app's e2e suite, and the
   dev app's `assayer.config.json`.
2. **`smoke-repo/` holds only generated files.** Each specimen is a `.ts` file plus a `.test.ts` that drives
   it. A manifest lists every specimen, and a refusals file lists every combination TypeScript rejected.
3. **`npm run test:generated` runs every generated test against the real Assayer.** Each test runs Assayer's
   own derived cases and compares what happened with what the configs predict.
4. **Ward fails when the committed `smoke-repo/` is stale.** A startup integration test regenerates in memory
   and compares the result with the files on disk.

The slice does not include the call layer, the stub dimension, harness gaps, the shim engine check, the shim
doc pages, the carry-over table, or retiring the hand-written specimens. `PLAN.md` keeps those.

## Decisions made on 2026-10-08

| Topic | Decision | Why |
|---|---|---|
| Where the generator lives | A private workspace package, `packages/specimen-generator`, type `cli-tool` | A probe showed ward checks nothing outside a workspace package. It reported "NO CHECK PROCESSED these paths". Plain eslint refused the probe file too, because no tsconfig owned it. Only a workspace package gets the coding and testing standards enforced by tooling |
| Where declaration files live | `packages/specimen-generator/declarations/`, excluded from lint by a folder entry in `eslint.config.js`, and left out of the package's `tsconfig.json` | Container code is consumer-shaped code with holes, and the repo's rules forbid the shapes it exists to show (`LINT.md`). The generator typechecks every declaration itself when it loads them, and refuses to run on any TypeScript error. So the declarations are still checked by a tool |
| Marker syntax | Unchanged from the prototype: `$arm('then')`, `$stmts('body')`, `$expr('field')` | The declarations folder is not linted, so the one-object-parameter rule does not reach it |
| How the generator runs a declaration's `code` | It transpiles the file with TypeScript and evaluates it in a `vm` sandbox. The sandbox answers the kit import with the generator's own marker implementations | This works the same from source and from `dist`, and it is how Assayer already loads harness files |
| What a generated test asserts | The observation shape below: each `if` and ternary driven both ways, one way, or never; failed cases; lints by rule and line; undriven, dark spots and gaps | Assayer's run engine already checks each case's input values against real execution. So the generator predicts only structure, and never has to copy Assayer's choice of values |
| Exit lines | Not asserted in this slice | The run engine already fails a case that reaches a different exit than Assayer predicted. Where an implicit exit sits is the hardest thing to predict, and it matters most for the call layer, where cause A lives. Exit lines join the observation with the call layer |
| Lint and admission wording | Not asserted. The rule name and the line are asserted | Core's own tests assert the exact wording. The generator would need one message template per lint case, which `ASSAYER-FINDINGS.md` lists as an open question |
| First committed matrix | Focus `if` and `ternary`. Every container. Depth 1. Type arguments `number` and `boolean`. Provenances `param`, `env`, `literal`, `const`, `external` | `boolean` is in the matrix because `gt`, `eq` and `not` return `boolean`, so they fill a condition only for `if<boolean>`. The run on 2026-10-08 wrote 1,169 specimens and TypeScript refused 19. Each generated test file takes about 8 seconds, because it starts Assayer's nested Jest run, so the suite takes about 12 minutes |
| Test timeout in the generated repo | `testTimeout: 60000` in `smoke-repo/packages/syntax-repository/jest.config.js` | A generated test's first run in a worker starts the nested runner and its compiler, which takes longer than Jest's default 5 seconds. It is one setting for the whole repo, never one per test |
| Environment reads of arrays | Not generated in this slice | `(process.env.KEY ?? '').split(',')` is never empty, so a length check on it goes one way only. The generator cannot predict that until shims are callees |
| Left out of the first matrix | The `random` provenance, and the `array-at` and `array-includes` shims as fills | They predict pinning and shim behavior Assayer does not have yet. Those are new features, not parsing holes |
| Formatting of generated files | The TypeScript printer only. No prettier | One less dependency. The printer's output is deterministic |
| Output layout | `smoke-repo/packages/syntax-repository/src/<focus>/<container>/<verdict>/<specimen>/<specimen>.ts`, with `<specimen>.test.ts` beside it. `<verdict>` is `driven`, `locked` or `undriven` | It mirrors the manual repo's package shape, so the same jest, tsconfig and desktop steps work against either repo. The verdict folder lets a reader open every specimen of one verdict together |
| What the generated smoke repo is checked by | Its own scripts: `generate:specimens`, `test:generated`, `typecheck:generated` | `smoke-repo/` stays out of ward's graph and out of lint, as consumer code does today |

## The generated test

Every generated test has this shape. The generator writes the predicted object from the configs alone.

```ts
import { join } from 'path';

import { specimenObserveBroker } from '@assayer/specimen-generator/observe';

describe('if-number-function-declaration-body-cond-gt-number-value-param', () => {
  it('VALID: {value: param} => if on line 2 driven both ways, every case passes', async () => {
    const observation = await specimenObserveBroker({
      repoRoot: join(__dirname, '..', '..', '..', '..', '..', '..', '..'),
      relPath: 'packages/syntax-repository/src/if/function-declaration/driven/if-number-function-declaration-body-cond-gt-number-value-param/if-number-function-declaration-body-cond-gt-number-value-param.ts',
    });

    expect(observation).toStrictEqual({
      branches: [{ kind: 'if', line: 2, driven: 'both-ways' }],
      caseFailures: [],
      lints: [],
      undriven: [],
      darkSpots: [],
      gaps: [],
    });
  });
});
```

The template follows the testing standards. It has one `describe`, and one `it` whose name carries a
`VALID:` prefix and the `{input} => result` shape. It makes one `toStrictEqual` on a complete object. It has
no hooks, no conditionals, and no helper function in the file.

### The observation shape: `SpecimenOutcome`

The prediction and the observation are one contract, `specimenOutcomeContract`. One concept gets one shape
(rule R10).

| Field | Observation, from Assayer | Prediction, from the configs |
|---|---|---|
| `branches` | One row per branch in the file's analysis: its `kind`, its `startLine`, and `driven`. `driven` is `both-ways` when the passed cases' trace holds both a true and a false outcome for the branch's condition leaves. It is `one-way` when only one appears, and `never` when no case evaluated it. Sorted by line, then kind | One row for the focus node, at the line the generator wrote it on. `both-ways` when a leaf is settable. `one-way` when every leaf is known. For an undriven focus: `one-way` when both arms meet again after the branch, or when the ternary's value is not the scope's exit. `never` when the arms reach different exits. See "Undriven rules" below |
| `caseFailures` | One row per case whose status is `failed` or `errored`: its status and its message | Always empty |
| `lints` | `rule` and `startLine` of every lint, sorted by line | Locked specimens only: one `unreachable-exit` row per dead arm. The line is the dead arm's first statement. The last arm of a statement whose arms do not return is just the code after the branch, so it is never dead. Assayer reports a dead arm in every scope, including an arm that falls through |
| `undriven` | `startLine` of every undriven admission | One row for each branch no test can steer, on the rules below. A `process.argv` read can never be steered, so each argv leaf ternary gets a row too. Rows are sorted |
| `darkSpots` | `startLine` of every dark spot | Always empty. Every syntax in the first matrix is one Assayer claims to handle |
| `gaps` | `name` of every gap | Always empty |

**Undriven rules.** A leaf is undriven when it comes from outside the program. No test can set it.

- Both arms meet again after the branch. A case reaches the scope's exit without deciding the branch, and
  that case runs the branch once with the values the test process has. The focus goes `one-way`. This holds
  for a statement whose arms log or yield. It holds for a ternary whose value is not the exit: a field, a
  static field, a call argument, a `yield`, an object property, an exported const, a module statement or a
  default parameter. It holds in every scope.
- The arms reach different exits. The branch decides which exit a case reaches, so no case is derived and
  the focus goes `never`. This is a statement whose arms return, and a ternary that is itself the exit
  (`return cond ? a : b`, or a concise arrow body).

**Where an undriven admission sits.** There is one admission for each branch no test can steer.

- When the scope earns a case (the focus goes `one-way`), every admission sits on its own branch's line, in
  every scope. A class field's ternary runs in a `constructor` entry, because Assayer runs instance-field
  initializers in the constructor.
- When the scope earns no case, a named entry (a function, a method, an arrow in a variable or an object)
  still gets each admission on the branch's own line. The module is admitted as a whole on line 1. An inline
  function called where it is written, such as an immediately-invoked arrow, is admitted as a whole on its
  own first line.

A leaf that reads a `T | undefined` value from `process.env` or `process.argv` is written as a ternary of
its own, and that ternary is a branch too. An environment read goes both ways unless the focus is undriven,
and then it gets the focus's answer. `specimen-predict-transformer.ts` states the same rules in its
`PURPOSE` comment.

The prediction comes from the configs and the generated source text only. The file that builds it,
`specimen-predict-transformer.ts`, never imports Assayer and never reads Assayer's output. Rule P4 forbids
it: an expected value never comes from the code under test.

## Package layout

```
packages/specimen-generator/
  package.json                          scaffolded, then edited in step 2
  tsconfig.json  tsconfig.build.json  jest.config.js   scaffolded
  bin/specimen-generator-entry.ts       scaffolded, then edited in step 8
  declarations/                         lint-excluded, typechecked by the generator itself
    kit.ts                              the marker types the declarations import. Types only
    tsconfig.json                       strict, no noUnusedLocals, no noUnusedParameters
    containers/<name>.container.ts
    syntax/<name>.syntax.ts
    shims/<name>.shim.ts
  src/
    startup/  flows/  responders/  brokers/  transformers/  guards/  contracts/  statics/  errors/
```

```
smoke-repo/                             generated except for the four config files
  package.json                          hand-written, copied from manual-smoke-repo
  packages/syntax-repository/
    package.json  tsconfig.json  jest.config.js        hand-written
    specimen-manifest.json              generated
    REFUSED.md                          generated
    src/<focus>/<container>/<verdict>/<specimen>/<specimen>.ts   generated
    src/<focus>/<container>/<verdict>/<specimen>/<specimen>.test.ts   generated
```

## The build, step by step

Each step names who does it, every file it writes, and how it is verified. A step starts only after the
step before it passes its verification. Within a step, the groups marked "parallel" can go to separate
agents at the same time, because no file in one group imports a file in another.

"Orchestrator" means the session running the plan. "Agent" means a Sonnet sub-agent given one group of
files plus the rules in "Rules for every implementing agent" below.

### Step 1. Rename `smoke-repo` to `manual-smoke-repo`

Who: one agent. Then the orchestrator runs the full verification.

1. `git mv smoke-repo manual-smoke-repo`. Then move the untracked `smoke-repo/node_modules` with a plain
   `mv`. The `file:` path to `vendored-fixture` and the `paths` into `packages/` keep the same depth, so
   neither changes.
2. Change every reference that is a real path, a real folder name, or a doc pointing at the folder:

| File | What changes |
|---|---|
| `package.json` | `test:syntax` and `typecheck:syntax` point at `manual-smoke-repo` |
| `assayer.config.json` | `repoRoot` becomes `./manual-smoke-repo` |
| `eslint.config.js` | The ignore entry and its two comments name `manual-smoke-repo/**`. A second entry ignores the new `smoke-repo/**` |
| `eslint-rules/jest.config.js` | The comment names `manual-smoke-repo` |
| `packages/core/test/harnesses/specimen-catalogue.ts`, `run-unit.harness.ts`, `syntax-traits.ts`, `example-resolution.harness.ts`, `stub-graph.harness.ts` | The path constant, and the comments that name the folder |
| `packages/app/test/harnesses/smoke-cache.harness.ts`, `syntax-surface.harness.ts`, `e2e-fixtures.ts`, `packages/app/test/e2e-global-build.ts` | The path constant, the comments, and the header regex in `syntax-surface.harness.ts` (`Assayer \| manual-smoke-repo …`), because the header shows the root folder's name |
| The comment headers of the `*.e2e.ts` files under `packages/app/src/flows/app/` | The folder name |
| `packages/core/src/brokers/analyze/file/analyze-file-broker.integration.test.ts`, `packages/core/src/brokers/run/unit/run-unit-broker.integration.test.ts` | Comments that name the folder |
| `CLAUDE.md`, `packages/core/CLAUDE.md`, `plan/open-defects.md`, `vendored-fixture/index.d.ts`, `vendored-fixture/index.js` | Every mention of the hand-written catalogue's folder |

3. Leave alone every string that is made-up test data, such as `'/repo/smoke-repo'` in unit tests, a
   `rootFolderName: 'smoke-repo'` in a stub, or a `USAGE` example. They name no real folder. Also leave
   the npm package names inside `manual-smoke-repo/package.json` and its lockfile.
4. Fix the catalogue failure already on master. `happy-path/array/length-at` has no line in
   `specimen-registry.ts`. The orchestrator writes that line by reading the specimen, following
   `packages/core/CLAUDE.md` section 6, step 1b. An agent never writes a registry line.

Verify: `npm run test:syntax`, then a full `npm run ward`. Both must pass. The orchestrator runs both.

### Step 2. Scaffold the package and wire it in

Who: the orchestrator.

1. Run `dungeonmaster create-package --name specimen-generator --type cli-tool --description "Generates
   Assayer's specimen matrix and the tests that drive it"`. Never hand-write the configs.
2. In `packages/specimen-generator/package.json`: set `"private": true` and delete `publishConfig`. Add the
   dependencies `@assayer/core`, `@assayer/shared` and `@assayer/npm` beside `@assayer/node`. Add an export
   key `"./observe"` whose `source` is `./src/brokers/specimen/observe/specimen-observe-broker.ts`.
3. In `eslint.config.js`: add `packages/specimen-generator/declarations/**` to the global ignores, with a
   comment that says why: the folder holds consumer-shaped code with holes.
4. In `packages/specimen-generator/tsconfig.json`: exclude `declarations/**`.
5. In `packages/core/src/brokers/brokers.ts`: add `export * from './analyze/file/analyze-file-broker';`. The
   observe broker needs the analysis, because the run result carries coverage IDs but not branch lines.
6. Copy the prototype's declarations from `tmp/specimen-generator-v2/` into
   `packages/specimen-generator/declarations/`: `configs/containers/`, `configs/syntax/`, `configs/shims/`,
   and `kit.ts`. Rewrite `kit.ts` as types only: `declare const` for every marker and every helper. The
   generator supplies the run-time versions inside the sandbox. Write `declarations/tsconfig.json` with the
   prototype's options: `strict`, target ES2022, lib ES2022, types `node`.
7. Do not copy `configs/types.ts`, `configs/provenances.ts` or `configs/matrix.ts`. They become statics in
   step 3.

Verify: `npm run ward -- -- packages/specimen-generator packages/core/src/brokers/brokers.ts eslint.config.js`.

### Step 3. Contracts, statics and errors

Who: three agents. Groups 3b and 3c run in parallel first. Group 3a runs after them, because its fill
tree imports the `Provenance` type that group 3b defines.

Types-only contracts hold TypeScript syntax nodes, which Zod cannot check. They have no test and no stub.
Every other contract has a `-contract.test.ts` and a `.stub.ts`.

**Group 3a: types-only contracts.** One file each, under `src/contracts/<name>/<name>-contract.ts`.

| Contract | What it holds |
|---|---|
| `loaded-syntax` | One syntax or shim declaration after loading: name, origin (`syntax` or `shim`), description, kind (`statement` or `expression`), holes (name, type text, resolved symbol), return type text, type parameter name, the type arguments its constraint allows, anchors, arm names, the shim's `form` and `builtin`, the `code` arrow node, its source file, and the run-time `code` function |
| `syntax-instance` | One loaded syntax for one type argument: the loaded syntax, the type argument, the label (`gt-number`), the holes with the type substituted, the anchors resolved to that type, and the substituted return type |
| `container-slot` | One slot: name, kind (`statement` or `expression`), reach, arm, the marker node, the callable node around it, and whether that callable takes `$params` |
| `loaded-container` | One container: name, description, the `code` arrow node, its source file, its slots, every marker node, whether `$Entry` is a class, and whether it exports by default |
| `fill-tree` | A recursive union. A leaf has its owner's name, hole name, type text, provenance and value. A node has a syntax instance and one fill per hole |
| `specimen-plan` | One planned specimen: the focus instance, the container, the slot, the fill tree, the path to the varying leaf, the varying leaf's provenance, the folder name and the entry name |

**Group 3b: Zod contracts.** Each with contract, test and stub.

| Contract | Fields |
|---|---|
| `provenance` | The enum `param`, `env`, `literal`, `const`, `random`, `external`. The fill tree and the manifest entry both use it |
| `specimen-outcome` | `branches` (kind `if`, `switch` or `ternary`; line; driven `both-ways`, `one-way` or `never`), `caseFailures` (status `failed` or `errored`; message), `lints` (rule; startLine), `undriven` (startLine), `darkSpots` (startLine), `gaps` (name) |
| `generated-file` | `relPath` (relative to the output root), `content` |
| `refused-specimen` | `folder`, `reason` (TypeScript's messages, joined) |
| `manifest-entry` | `folder`, `relPath`, `focus`, `container`, `slot`, `path`, `provenance`, `uses` (every syntax and shim in the tree, focus first), `verdict` (`driven`, `locked` or `undriven`) |
| `generation-result` | `files` (generated files), `refused` (refused specimens), `manifest` (manifest entries) |
| `generator-args` | `mode` (`write` or `check`), optional `focus`, `container` and `depth` |

**Group 3c: statics and errors.** Each with its test.

| File | What it holds |
|---|---|
| `statics/matrix/matrix-statics.ts` | `focus` `['if', 'ternary']`, `depth` 1, `plainest` `['param', 'env', 'const']`, `typeArguments` `['number', 'boolean']`, `provenances` `['param', 'env', 'literal', 'const', 'external']`, `excludedFills` `['array-at', 'array-includes', 'math-random']` |
| `statics/provenance/provenance-statics.ts` | Per provenance: how a test treats it (`sets`, `known` or `unsettable`) and when a slot offers it (`params`, `module-load` or `always`). Copied from the prototype's `provenances.ts`, without `random` |
| `statics/type-list/type-list-statics.ts` | Per base type (`number`, `string`, `boolean`): the known value, the array samples, the `process.env` read, the `process.env` array read, the `process.argv` read, the `process.argv` array read. Copied from the prototype's `types.ts`, without the `random` fields and without `fromRandom` |
| `statics/generator-layout/generator-layout-statics.ts` | The declaration folder names and suffixes, the output root's segments, the manifest and refusals file names, and the test file suffix |
| `statics/specimen-typecheck/specimen-typecheck-statics.ts` | The compiler options generated specimens are checked under, as plain values: strict, noUnusedLocals, noUnusedParameters, noImplicitReturns, target ES2022, lib ES2022, types node |
| `statics/observe/observe-statics.ts` | The cache folder prefix under the OS temp folder, the path from this package to `packages/core`, and the fixed analyzer hash the observe broker passes |
| `errors/declaration/declaration-error.ts` | `DeclarationError`: the declaration file, and what is wrong with it. Every refusal the loader raises uses it |
| `errors/arm-reached/arm-reached-error.ts` | `ArmReachedError`: the arm name. The run-time `$arm` throws it, and the generator catches it to learn which arm known values reach |

Verify: each agent runs `npm run ward -- -- <its files>`.

### Step 4. Read the declarations

Who: two agents, in parallel. Pure transformers and guards, each with its test.

**Group 4a.**

| File | What it does |
|---|---|
| `transformers/declaration-export-name/declaration-export-name-transformer.ts` | File name and kind to the one export name the file must have: `gt.syntax.ts` to `gtSyntax`, `class.container.ts` to `classContainer` |
| `transformers/syntax-shape/syntax-shape-transformer.ts` | A declaration's source file, the type checker and its evaluated export to a `LoadedSyntax`. It throws a `DeclarationError` for each refusal the prototype raises in `loadTyped`, with the same meaning. The prototype's `generate.ts` lines 84 to 137 are the reference |
| `transformers/syntax-instances/syntax-instances-transformer.ts` | `LoadedSyntax[]` and the matrix's type arguments to `SyntaxInstance[]`, one per allowed type argument |

**Group 4b.**

| File | What it does |
|---|---|
| `transformers/container-shape/container-shape-transformer.ts` | A container's source file and evaluated export to a `LoadedContainer`. Refusals as in the prototype's lines 176 to 200 |
| `transformers/type-info/type-info-transformer.ts` | A type's text to its base-type info, deriving `readonly X[]` and `X \| undefined` from the base type. Prototype lines 150 to 168, without `random` |
| `transformers/offered-provenances/offered-provenances-transformer.ts` | A slot and the enabled provenances to the provenances that slot offers |

Verify: each agent runs `npm run ward -- -- <its files>`.

### Step 5. Build the matrix and render the code

Who: two agents, in parallel.

**Group 5a.**

| File | What it does |
|---|---|
| `transformers/fill-variants/fill-variants-transformer.ts` | A focus instance, a depth, a slot, every instance and the matrix to a list of variants (tree, path, provenance). Exactly one leaf varies. A node never fills its own hole directly. A shim with no inputs is never a node. Prototype lines 243 to 276 |
| `guards/has-all-literal-node/has-all-literal-node-guard.ts` | True when some node in the tree has every hole filled by a literal. Those trees are never written |
| `transformers/specimen-folder-name/specimen-folder-name-transformer.ts` | Focus label, container, slot, path and provenance to the folder name, and the entry name: PascalCase for a class, camelCase otherwise |

**Group 5b.**

| File | What it does |
|---|---|
| `transformers/fill-tree-render/fill-tree-render-transformer.ts` | A fill tree and an arm kind to the rendered focus code plus what it needs: parameters on the callable, and declarations at the top of the file. It builds nodes with the TypeScript factory and parses small snippets into nodes. It never splices text into other text. Prototype lines 282 to 343. Put shim rendering in `shim-call-layer-transformer.ts` and leaf rendering in `leaf-layer-transformer.ts` |
| `transformers/specimen-assemble/specimen-assemble-transformer.ts` | A container, a slot, a rendered tree and the entry name to the specimen's source text. It keeps the block that holds the slot, swaps every marker, exports the entry, and adds `export {};` to a script. Prototype lines 345 to 394 |

Verify: each agent runs `npm run ward -- -- <its files>`. Each test asserts complete generated source text
for at least one statement slot, one expression slot and one module slot.

### Step 6. Predict, write the test, and read Assayer back

Who: the orchestrator writes `specimen-predict-transformer.ts`, because it holds the prediction rules and
P4 rests on it. Two agents write the rest, in parallel.

**Orchestrator.**

| File | What it does |
|---|---|
| `transformers/arm-reached/arm-reached-transformer.ts` | Runs a syntax instance's `code` with known values, and returns the arm it reached by catching `ArmReachedError` |
| `transformers/specimen-predict/specimen-predict-transformer.ts` | A specimen plan and its generated source text to a `SpecimenOutcome`, by the rules in "The observation shape" above. A layer file, `locate-lines-layer-transformer.ts`, parses the generated text and finds the focus line, each arm's first statement line, and the start line of the scope holding the focus |

**Group 6a.**

| File | What it does |
|---|---|
| `transformers/specimen-test-source/specimen-test-source-transformer.ts` | A folder, a relative path, the depth back to the smoke repo's root, a title and a prediction to the test file text in "The generated test" above. The test name is `VALID: {<varying leaf>: <provenance>} => <summary>`. The summary comes from the prediction. Built as nodes and printed, like the specimen |
| `transformers/manifest-entry/manifest-entry-transformer.ts` | A specimen plan and its prediction to a `ManifestEntry` |
| `transformers/refused-report/refused-report-transformer.ts` | Refused specimens to the text of `REFUSED.md`: one line per folder, with TypeScript's reason, sorted |

**Group 6b.**

| File | What it does |
|---|---|
| `transformers/specimen-outcome-projection/specimen-outcome-projection-transformer.ts` | Assayer's `FileAnalysis` and `RunResult` to a `SpecimenOutcome`, by the "Observation" column above. It maps each trace event to its branch through the analysis's condition leaf IDs, never by reading an ID's text |

Verify: each runs `npm run ward -- -- <its files>`.

### Step 7. Brokers

Who: two agents, in parallel. Each broker has a proxy and a test. Every file system, `vm` and TypeScript
compiler call goes through `#gateway`.

**Group 7a.**

| File | What it does |
|---|---|
| `brokers/declarations/load/declarations-load-broker.ts` | Reads every declaration under `declarations/`, sorted. Builds one TypeScript program with `declarations/tsconfig.json`. Refuses on any diagnostic, quoting it. Transpiles each file and evaluates it in a `vm` sandbox, whose `require` answers the kit with the run-time markers and nothing else. Checks the file exports exactly one const with the expected name. Returns the loaded syntaxes, shims and containers |
| `brokers/specimens/typecheck/specimens-typecheck-broker.ts` | Typechecks every generated specimen in memory, through a compiler host over the generated texts, under `specimenTypecheckStatics`. Returns the TypeScript messages per file. Nothing is written to disk first |
| `brokers/specimens/generate/specimens-generate-broker.ts` | Load, then plan every variant, assemble, typecheck, drop the refused, predict, write test text, build the manifest. Returns a `GenerationResult`. It writes nothing. Output order is sorted by relative path |

**Group 7b.**

| File | What it does |
|---|---|
| `brokers/specimens/write/specimens-write-broker.ts` | Removes the generated `src/`, the manifest and `REFUSED.md` under the output root, then writes every file in the result. It never touches the four hand-written config files |
| `brokers/specimens/check/specimens-check-broker.ts` | Compares a `GenerationResult` with the files on disk. Returns every path that differs, is missing, or is on disk but not generated |
| `brokers/specimen/observe/specimen-observe-broker.ts` | Takes `repoRoot` and `relPath`. Walks and analyzes the file, runs it with `runUnitBroker`, and projects both into a `SpecimenOutcome`. Its cache folder is fixed per process, at the OS temp folder plus the process ID, and emptied before each run. A fresh folder per run makes ts-jest keep one compiler per run, which ran the core harness out of memory |

Verify: each runs `npm run ward -- -- <its files>`.

### Step 8. Command, flow, startup and scripts

Who: one agent.

| File | What it does |
|---|---|
| `responders/generate/run/generate-run-responder.ts` | Parses argv into `GeneratorArgs`. Refuses any argument it does not read, before doing anything, and names the accepted flags: `--check`, `--focus=`, `--container=`, `--depth=`. Runs the generate broker, then the write broker or the check broker. Prints one summary line to stdout. Returns the exit code: 1 when check finds a difference |
| `flows/generate/generate-flow.ts` | Routes to the responder |
| `startup/start-specimen-generator.ts` | Calls the flow. Replaces the scaffolded body |
| `startup/start-specimen-generator.integration.test.ts` | Three tests: `--check` against the committed `smoke-repo/` exits 0; an unknown argument is refused and nothing is written; a `--focus` naming no declaration is refused with the name |
| `bin/specimen-generator-entry.ts` | Passes argv to startup and sets the exit code |

Root `package.json` scripts:

| Script | Command |
|---|---|
| `generate:specimens` | Runs the bin from source with `tsx`, under the `source` export condition. The agent confirms the exact flags by running it once |
| `test:generated` | `jest --config smoke-repo/packages/syntax-repository/jest.config.js` |
| `typecheck:generated` | `npm run typecheck --prefix smoke-repo` |

Verify: `npm run ward -- -- <its files> package.json`. The `--check` integration test is expected to fail
until step 9 commits the output.

### Step 9. The generated smoke repo, and the first generation

Who: the orchestrator.

1. Write the four hand-written config files under `smoke-repo/`: `package.json`, and `package.json`,
   `tsconfig.json` and `jest.config.js` under `packages/syntax-repository/`. Copy them from
   `manual-smoke-repo/`. Add one `paths` entry: `@assayer/specimen-generator/observe` to the observe
   broker's source. Add one for `@assayer/core/brokers` to core's brokers barrel. The jest config derives
   its module map from these paths, as the manual one does.
2. Run `npm run generate:specimens`.
3. Read a sample of the output by hand: at least one specimen per container, and one per verdict. Check
   the code is what a person would write, and that each prediction matches the code.
4. Run `npm run typecheck:generated`, then `npm run test:generated`.
5. Run a full `npm run ward`. The `--check` test now passes.
6. Commit the output and the generator together.

### Step 10. First run against Assayer, and triage

Who: the orchestrator, with the user deciding each cause. `TRIAGE-1.md` records the first triage and the
decisions on it.

A failing generated test means Assayer and the configs disagree. A human decides which one is wrong.

1. Group the failures by the field that differs and the shape of the specimen, such as "every getter
   specimen reports a gap", or "every module-scope locked specimen has no lint".
2. Record each group in a triage file, with two or three specimen folders as examples.
3. Decide for each group: is Assayer wrong, or is the config wrong?
4. **Assayer wrong:** fix it the way `packages/core/CLAUDE.md` section 6 says. The generated specimen that
   caught the bug is the regression specimen for its fix, so no extra hand-written specimen is required. A
   hand-written specimen's test that the fix changes is updated by reading the code, never by copying
   Assayer's new output. The generated specimens that caught it pass once the fix lands.
5. **Config wrong:** fix the declaration or the prediction rule, then regenerate.
6. Never change a prediction rule because Assayer's output says something else. That is rule P4.
7. Run the generated suite one folder per command, such as `npm run test:generated -- if/class`. The whole
   suite in one command runs out of memory on this machine.

## Rules for every implementing agent

The orchestrator pastes this whole section into every agent's prompt, under the agent's file list. The rules
override anything the agent would do by default.

### Before writing anything

1. Call `get-architecture` and `get-testing-patterns` once. Call `get-folder-detail` once for each folder
   type you will write into. Read the results before planning.
2. Search before creating. Use `discover` to check the file or an equivalent does not exist already.
3. Write only the files your group lists. Touch no other package, no other file in this package, and no
   declaration file. If a listed file needs a change elsewhere, stop and report it.
4. Never edit `.claude/settings.json`, `.claude/settings.local.json`, `.mcp.json` or any `.env` file.

### How every implementation file is written

5. Exactly one export per file, as `export const name = (...): ReturnType => ...`. The only `export class`
   is an error class in `errors/`. Never a default export. Never `export function`. Re-export a type with
   `export type { X } from`, never `export { type X }`.
6. Every function takes one object argument, destructured, with its type written inline. Every exported
   function declares its return type.
7. The file opens with the `PURPOSE` and `USAGE` comment block, above the imports. Rewrite it after the code
   is done, so it describes the code you wrote. `PURPOSE` says why the file exists and when to use it over
   its nearest sibling. It never restates the signature.
8. Import every outside package and every Node built-in through `#gateway/<folder>/<subpath>`: TypeScript,
   `fs`, `path`, `vm`, `os`, `process`. Never import `typescript`, `fs` or `path` directly.
9. Respect the folder import rules. A transformer or guard never imports a broker. A startup file imports
   only a flow.
10. No number written into an expression, except `-1`, `0`, `1` and array indexes. Every other number
    lives in a `statics/` file.
11. Our own object types come from `contracts/`. Every Zod object contract and every string and number
    field in it carries `.brand<'…'>()`. A contract that holds TypeScript syntax nodes is types-only, with
    no test and no stub.
12. Never `any`. Never `as unknown as`. Never `@ts-ignore` or `@ts-expect-error`. Use `as` only for a fact
    the compiler cannot know, never to silence it.
13. No `while (true)`. Use recursion with an early return.
14. Every failure is thrown, logged or handled. No empty or silent `catch`. An error message names what is
    wrong, where it is (the declaration file, the slot, the hole), and what would fix it.
15. Output is deterministic. Sort every list that reaches a file or a result. Never read the clock or
    `Math.random()`. Never let a `Map` or `Set` iteration order decide output order.
16. Generated code is built by swapping syntax-tree nodes and by parsing small snippets into nodes. Never
    build code by joining strings of code.
17. The prediction never comes from Assayer. Only `specimen-observe-broker.ts` and
    `specimen-outcome-projection-transformer.ts` may import `@assayer/core` or read Assayer's types. Every
    other file must not.
18. Comments and messages use plain language: one idea per sentence, no undefined jargon. They describe
    what the code does now. Never "previously", "used to", "now fixed", or a count of things that grow.
    Keep comments rare. Write one only to record why the code is this way, or what breaks if it changes.
19. A command refuses an argument it does not read, before it does anything, and names the flags it
    accepts.

### How every test is written

20. Name a unit test `<file>.test.ts`, beside the file. Name a startup or flow test
    `<file>.integration.test.ts`. A broker and a responder each get a `.proxy.ts` beside them. Transformers,
    guards, statics, errors and contracts get no proxy.
21. Use `describe` blocks to group, never comments. Every `it` name starts with `VALID:`, `INVALID:`,
    `ERROR:`, `EDGE:` or `EMPTY:`, and reads `{input} => result`.
22. Assert with `toStrictEqual` on the complete object or array, and `toBe` for one value. Never use
    `toEqual`, `toMatchObject`, `toContain`, `toBeTruthy`, `toBeFalsy`, `toHaveProperty`, `toHaveLength`,
    `toBeDefined`, `toBeUndefined`, `toBeNull`, `expect.objectContaining`, `expect.arrayContaining`,
    `expect.stringContaining`, `expect.any` (except `expect.any(Function)`), or `.not.` on any Jest matcher.
    A string assertion is `toBe('the full text')` or an anchored regex `/^…$/u`.
23. No `beforeEach`, `afterEach`, `beforeAll` or `afterAll` in a unit test. No `if`, ternary, `&&`, `switch`
    or `try` in a test body. No function declared inside a test file or a proxy.
24. Create a fresh proxy inside each test, before calling the code under test. Mock only what crosses an
    I/O boundary, through the gateway wrapper's own proxy. Never `jest.mock`, `jest.spyOn` or
    `registerMock` in a test file. Stage every mocked call by its arguments, never with a catch-all
    `calledWith([])` for a function that takes arguments.
25. Build a failure from the gateway proxy's named scenario, such as `missing` or `denied`, or a recorded
    failure stub. Never a hand-made `Error`.
26. Get a type in a test from a stub: `ReturnType<typeof XStub>`. Never import a type from a contract,
    except in that contract's own test. Omit an optional property rather than passing `undefined`.
27. When three or more tests differ only by an input value, use `it.each`, and derive the list from a
    statics file, never a hand-written array.
28. Cover every branch of the file under test. Read the implementation line by line, and write a test for
    every `if`, `else`, ternary arm, `??`, `?.`, `catch`, and every empty, one and many case.
29. Expected values in a test are written by hand from what the code should do. Never run the code and
    paste its output into the test.

### How to verify and report

30. Run only `npm run ward -- -- <every file you wrote>`, with `timeout: 600000`. Never run a bare
    `npm run ward`. Never run `npx jest`, `npx eslint`, `npx tsc` or `npm test`. Never run a build.
31. Fix every failure in your files until ward exits 0. Never call a failure pre-existing without proving it
    against a clean checkout.
32. The pre-edit hook refuses an edit that breaks a rule, and writes nothing. When it refuses, resubmit the
    whole corrected edit.
33. Never commit. Never touch git state.
34. Report back in this form, and nothing longer:

```
DONE — <one line: what now exists>

FILES —
  <path> — <one line: what it does>

WARD — <the exact ward command> — <exit code> — <run id>

OPEN — <anything you could not do, or a change you need outside your files. "none" if none>
```

## What comes after this slice

In the order `PLAN.md` gives:

1. Widen the matrix: `string` (cause F), depth 2, the `random` provenance once Assayer pins.
2. Exit lines in the observation, together with the call layer in `CALLABLES.md`.
3. Shims as callees, the shim engine check, and the shim doc set, in `SHIMS.md`.
4. The stub dimension, in `STUBS.md`.
5. The carry-over table, and retiring `manual-smoke-repo/`.

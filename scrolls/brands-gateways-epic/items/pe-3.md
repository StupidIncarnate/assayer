# PE-3: run an ESM consumer's code as ESM

## Result

Phase 1 is done. Phase 2 is not started, for two reasons.

- Running ESM as ESM under Jest needs Node's `--experimental-vm-modules` flag in the process that runs the test
  file. Node v22.17.0 has no `vm.SourceTextModule` without it. Who supplies that flag is a product decision.
- The fix reaches files outside PE-3's list: the generated test file, the entry resolver, `run-unit-broker`, a new
  Jest resolver file at core's root, core's `package.json` `files` list, and `packages/core/CLAUDE.md` section 8.

Section 6 is the recommendation. Section 7 is the file list the operator would need to approve for Phase 2.

Every measurement below was taken on 2026-10-01 with the scripts in `tmp/pe-3/`. `tmp/pe-3/run.cjs` builds a nested
Jest config shaped like `run-execute-cases-broker`'s and runs it with `runCLI`. Its fixtures are `tmp/pe-3/cjs`,
`tmp/pe-3/esm`, `tmp/pe-3/esmplain` and `tmp/pe-3/esmdep`. `tmp/pe-3/marker-transformer.cjs` records, for every
file ts-jest compiles, whether ts-morph's TypeScript parsed it.

## 1. Installed versions

| Tool | Version | Where read |
|---|---|---|
| Node | v22.17.0 | `node --version` |
| Jest | 30.0.4 | `node_modules/jest/package.json` |
| jest-runtime | 30.0.4 | `node_modules/jest-runtime/package.json` |
| ts-jest | 29.4.0 | `node_modules/ts-jest/package.json` |
| `typescript` | 5.8.3 | `node_modules/typescript/package.json` |
| ts-morph's bundled TypeScript | 5.8.3 | `require('ts-morph').ts.version` |

The two TypeScript copies have the same version today. They are still two separate objects. A compile on the wrong
one is invisible until the versions drift apart, which is why the marker checks object identity, not the version.

## 2. How a consumer's module format is decided

Node decides a file's format at run time. A `.mts` or `.mjs` file is ESM. A `.cts` or `.cjs` file is CommonJS. A
`.ts` or `.js` file follows the `type` field of the nearest `package.json`: `module` means ESM, anything else means
CommonJS.

TypeScript reports the same answer only when `module` is `node16`, `node18` or `nodenext`. It exposes the answer as
`sourceFile.impliedNodeFormat`, and as `ts.getImpliedNodeFormatForFile`. `tmp/pe-3/implied.js` measured this with
ts-morph's TypeScript, for each `type` and each `module`:

| `module` | `.ts` with `type: module` | `.ts` with no `type` or `type: commonjs` | `.mts` | `.cts` |
|---|---|---|---|---|
| `node16`, `nodenext` | ESM | CommonJS | ESM | CommonJS |
| `commonjs`, `esnext`, `preserve` | no answer | no answer | ESM | CommonJS |

So the format has three sources, and Assayer needs all three:

- tsconfig `module`. A `commonjs` module means the consumer's TypeScript emits CommonJS. An ES module kind
  (`es2015` up to `esnext`, or `preserve`) means the consumer's code is written for ESM, but TypeScript makes no claim
  about how it runs.
- `package.json` `type`. TypeScript reads it for the node module kinds. For the ES module kinds nobody reads it,
  so Assayer would read it itself, through the same TypeScript call with a node module kind.
- The file extension. Assayer's surface holds only `.ts` and `.tsx` today. The transform pattern in
  `run-execute-cases-broker.ts` is `'^.+\\.tsx?$'`, and `discover` finds no `.mts` or `.cts` handling in core. So
  extension only matters if `.mts` and `.cts` join the surface later.

Where Assayer reads the consumer's tsconfig today:

- `packages/core/src/brokers/tsconfig/read/tsconfig-read-broker.ts:26` — `const tsconfig = readNearestTsconfig({ searchPath });`
  — the stitch reads the nearest tsconfig through the typescript gateway. Only the import resolver uses it.
- `packages/@gateway/npm/src/typescript/read-nearest-tsconfig/read-nearest-tsconfig.ts:23` —
  `export const readNearestTsconfig = ({` — the gateway function, on ts-morph's TypeScript.
- The run path reads no tsconfig. ts-jest finds `tsconfig.json` from Jest's `rootDir` on its own, and merges
  `coreRuntimeStatics.tsJestCompilerOptions` over it.

Nothing in Assayer reads `package.json` `type` today.

## 3. What Jest 30.0.4 and ts-jest 29.4.0 support

### Jest

- ESM test files need `vm.SourceTextModule`. On Node v22.17.0 it is `undefined` without `--experimental-vm-modules`
  (`node -e "console.log(typeof require('vm').SourceTextModule)"` prints `undefined`).
- Without the flag, Jest treats every file as CommonJS, whatever its `package.json` says. `jest-resolve`'s
  `cachedShouldLoadAsEsm` returns `false` first thing when `runtimeSupportsVmModules` is false. So today a
  `type: module` consumer's generated `assayer.test.js` still loads as CommonJS. That stops being true the moment the
  flag is on.
- `extensionsToTreatAsEsm` is one list per config, keyed by extension. Jest cannot load one `.ts` file as ESM and
  another as CommonJS inside one config.
- Node 22's unflagged `require(esm)` does not help. Jest has its own module loader. `jest-runtime`'s `requireModule`
  throws `Must use import to load ES Module: <path>` with code `ERR_REQUIRE_ESM` for any file it loads as ESM.
  Measured: a CommonJS test file that `require`s an ESM `.ts` subject fails with exactly that message.
- In an ESM test file the `jest` object is not a global. It is on `import.meta.jest`, which `jest-runtime` sets in
  `initializeImportMeta` (`meta.jest = jest`). `import { jest } from '@jest/globals'` also works, but only where the
  consumer's tree can resolve `@jest/globals`.
- `jest.resetModules()` clears the ESM registry too (`this._esmoduleRegistry.clear()`). Measured: after
  `jest.resetModules()`, a second `await import()` runs the subject's module body again.
- `jest.mock` hoisting does not exist for ESM. Assayer's generated test file never calls `jest.mock`, so nothing
  breaks there.
- `setupFiles` (`probe-runtime.js`) and `moduleNameMapper` (`@assayer/core` to `harness-registrar.js`) both work in
  ESM mode. Measured: an ESM harness's `import { assayerHarness } from '@assayer/core'`, mapped to a CommonJS
  registrar, registers into the same `declarations` array the test file reads.

### ts-jest

`node_modules/ts-jest/dist/legacy/compiler/ts-compiler.js` has three compile paths:

| Path | When | TypeScript used |
|---|---|---|
| Language service | `isolatedModules` off | `compiler` |
| `this._ts.transpileModule` | `isolatedModules` on, `module` not a node kind | `compiler` |
| `tsTranspileModule` | `isolatedModules` on, `module` is `node16`, `node18` or `nodenext` | the installed `typescript` |

`tsTranspileModule` lives in `node_modules/ts-jest/dist/transpilers/typescript/transpile-module.js`, which does
`require("typescript")`. That path also compiles with `_initialCompilerOptions`, not the options ts-jest fixes up for
the module kind.

ESM mode is `useESM && supportsStaticESM`. In ESM mode ts-jest sets `module` to `ESNext` and keeps `compiler`, except
on the `tsTranspileModule` path, which it still takes for a node module kind.

So the answer to "does ts-jest's ESM path honour `compiler`" is yes, under one condition. The `module` ts-jest sees
must not be a node kind. That is the same condition the CommonJS path has today.

## 4. Measurements

Each row is one `runCLI` call with `cache: false`. "ts-morph parsed" is the marker's `parsedByMorph`.

| Consumer | Run mode | `module` override | Result | ts-morph parsed |
|---|---|---|---|---|
| CommonJS (`node16`, no `type`) | CommonJS | `commonjs` | pass | yes |
| CommonJS (`node16`, no `type`) | CommonJS | none | pass | **no** |
| ESM (`nodenext`, `type: module`, `import.meta`, top-level `await`) | CommonJS | `commonjs` | `SyntaxError: Cannot use 'import.meta' outside a module` | yes |
| same | CommonJS | none | `SyntaxError: Cannot use import statement outside a module` | **no** |
| ESM, no `import.meta`, imports `./band.js` | CommonJS | `commonjs` | `Cannot find module './band.js' from 'src/grade.ts'` | yes |
| ESM, imports an ESM-only package | CommonJS | `commonjs` + TS resolver | `SyntaxError: Unexpected token 'export'` | yes |
| ESM | ESM, no flag | `esnext` | `SyntaxError: Cannot use import statement outside a module` | — |
| ESM | ESM + flag | `esnext` | `Cannot find module './band.js' from 'src/grade.ts'` | yes |
| ESM | ESM + flag | none | `Cannot find module './band.js' from 'src/grade.ts'` | **no** |
| ESM | ESM + flag | `esnext` + TS resolver | pass (with `import.meta`, top-level `await`, reload) | yes |
| ESM + harness | ESM + flag | `esnext` + TS resolver + registrar mapping | pass, one declaration collected | yes |
| ESM, imports an ESM-only package | ESM + flag | `esnext` + TS resolver | pass | yes |
| CommonJS (`node16`) | CommonJS | `commonjs` + TS resolver | pass | yes |
| ESM, imports `./band.js` | CommonJS | `commonjs` + TS resolver | pass | yes |

"TS resolver" is `tmp/pe-3/ts-resolver.cjs`, a Jest `resolver`. For a relative request, it asks ts-morph's
`ts.resolveModuleName` with the nearest tsconfig's options, and returns the `.ts` file TypeScript resolves to. Every
other request goes to Jest's default resolver.

A cold Node process that starts Jest and ts-jest and runs one two-file test took 1.02 s to 1.14 s and about 200 MB peak
memory, in CommonJS mode and in ESM mode alike (three runs each, `/usr/bin/time`).

What the table shows:

- Without the `module` override, a node16 or nodenext tsconfig with `isolatedModules` leaves ts-morph's TypeScript.
  This is concession 19's premise, and it holds.
- Concession 19 also says "The emitted code is the same CommonJS in every probe". That holds only for a CommonJS
  consumer. For a `type: module` consumer with no override, `tsTranspileModule` emits ESM.
- An ESM consumer fails under today's runner in four separate ways: `import.meta`, top-level `await`, a `.js`
  specifier that names a `.ts` file, and an ESM-only dependency. Only the `.js` specifier is fixable without ESM mode.
- The `.js` specifier also fails in ESM mode. Jest's resolver does not know TypeScript's rule that `./band.js` names
  `band.ts`. A Jest `resolver` that asks TypeScript fixes it in both modes. It also fixes a CommonJS `node16` consumer
  that writes `.js` specifiers, which today's runner fails on as well.
- ESM mode with an `esnext` override and the TS resolver passes everything, on ts-morph's TypeScript.

## 5. Options

### Option A: keep CommonJS for everyone

This is today's runner.

- Costs nothing.
- Breaks every ESM consumer that uses `import.meta`, top-level `await`, an ESM-only package, or `.js` specifiers.
  That is nearly every `type: module` repo.
- Fails the requirement that Assayer works standalone in any TypeScript repo.

### Option B: CommonJS, plus shims for ESM features

Run everything as CommonJS. Add the TS resolver for `.js` specifiers. Add a probe-time transformer that rewrites
`import.meta.url` to a CommonJS equivalent.

- Fixes `.js` specifiers and `import.meta.url`.
- Cannot fix top-level `await`, because a CommonJS module body cannot `await`.
- Cannot fix an ESM-only package without transforming `node_modules`, which means compiling third-party code.
- The code does not run as ESM. Module semantics differ: live bindings, `this` at top level, evaluation order,
  `import.meta.dirname`. The requirement is not met.

### Option C: native ESM, in the process that calls Assayer

Set `useESM`, `extensionsToTreatAsEsm` and an `esnext` override for an ESM target, and keep calling `runCLI`
in-process.

- Works only if the process that called Assayer was started with `--experimental-vm-modules`. That is the CLI
  process, the desktop's Electron main process, and core's own Jest process for the integration tests.
- A consumer, or Assayer's bin script, must add the flag. The desktop's Electron main process may not accept it at
  all. This was not measured.
- jest-worker forks its children with `process.execArgv` and `process.env`. Setting `NODE_OPTIONS` before `runCLI`
  with workers on would reach the children. That mutates a global in a library, and still leaves Electron unmeasured.

### Option D: native ESM, in a child Node process Assayer starts with the flag

Assayer forks `node --experimental-vm-modules --no-warnings=ExperimentalWarning <core>/<runner entry>.js` and runs
Jest there. The consumer accepts nothing and sets nothing.

- Runs ESM as ESM: `import.meta`, top-level `await`, ESM-only packages and module reloads all pass (measured).
- Keeps ts-morph's TypeScript on every compile, because the override is `esnext`, never a node kind (measured).
- Costs about 1 s and 200 MB per cold child (measured). One long-lived child per batch of runs pays that once, and
  ts-jest then reuses one compiler, which matches section 8's "one config, one compiler" rule.
- Moving every run, CommonJS included, into the child makes one execution path. It also frees the nested Jest's
  memory when the child exits, instead of holding it in the CLI or Electron process.
- Depends on an experimental Node feature. Node 22 prints an `ExperimentalWarning` for it, which the flag above
  silences. Jest itself calls its ESM support experimental.
- The verdict already comes back through the run artifact `run.json`, not through Jest's reporting. So the child only
  needs to exit; it returns nothing.
- Electron's `child_process.fork` runs the child as Node. Whether that child honours `--experimental-vm-modules` was
  not measured.

Every option except A also needs these, whichever process runs Jest:

- The TS resolver, as a Jest `resolver` file at core's root.
- A per-target format decision, from tsconfig `module` and `package.json` `type`, through TypeScript's
  `getImpliedNodeFormatForFile`.
- An ESM version of the generated test file: `await import()` in place of `require`, and `import.meta.jest` in place of
  the `jest` global.
- An async `requireFresh`, so `caseResolveEntryBroker` can reload a module scope with `await import()`.
- Two nested Jest configs, one per format, in place of one. `extensionsToTreatAsEsm` is one list per config (section
  3), so a config cannot serve both formats. Each config stays identical across every file of its format, so a batch
  costs at most two ts-jest compilers.

## 6. Recommendation

Option D. Run the nested Jest in a child Node process Assayer starts with `--experimental-vm-modules`, for both
formats, so there is one execution path. Decide each target's format with TypeScript's own
`getImpliedNodeFormatForFile`:

- `module` is `node16`, `node18` or `nodenext`: use TypeScript's answer for the target file.
- `module` is `commonjs`, or unset with a CommonJS default: CommonJS.
- `module` is an ES module kind or `preserve`: ask the same TypeScript call with a node module kind, which applies
  Node's own `package.json` `type` rule. This branch is a product decision, because TypeScript itself makes no claim
  for these module kinds.

The ts-jest override then becomes `module: commonjs` for a CommonJS target and `module: esnext` with
`esModuleInterop: true` for an ESM target. Neither is a node kind, so every compile stays on ts-morph's TypeScript.
`esModuleInterop: true` also silences ts-jest's `TS151001` warning, which otherwise prints in ESM mode.

One limit stays. Inside one ESM run, Jest loads every `.ts` file as ESM, because `extensionsToTreatAsEsm` is
per-extension. An ESM target that imports a `.ts` file from a nested `type: commonjs` package would load that file as
ESM, where Node would load it as CommonJS. That is rare, and the format decision can name it as a P1 error later.

## 7. What Phase 2 needs

Product decisions for the operator:

1. Option D's child process, or option C's flag on the host process.
2. The format rule for an ES module kind with no node module resolution (section 6, third bullet).
3. Whether the desktop's Electron fork must be measured before Phase 2 starts.

Files Phase 2 would touch. The ones marked "outside" are not on PE-3's list:

| File | Change | On the list |
|---|---|---|
| `packages/core/src/statics/core-runtime/core-runtime-statics.ts` | two override sets, the resolver and runner-entry ceremony names | yes |
| `packages/core/src/contracts/core-runtime/core-runtime-contract.ts` | `resolver` and runner-entry paths | yes |
| `packages/core/src/transformers/core-runtime/core-runtime-transformer.ts` | build those paths | yes |
| `packages/core/src/brokers/run/execute-cases/run-execute-cases-broker.ts` | per-format config, fork the child | yes |
| `packages/core/ts-resolver.js` (new) | Jest `resolver` through ts-morph's `resolveModuleName` | outside (new root file) |
| `packages/core/run-jest.js` (new) | the child's entry: reads the config and calls `runCLI` | outside (new root file) |
| `packages/core/package.json` | add both new root files to `files` | outside |
| a new broker, for example `packages/core/src/brokers/module-format/read/` | the format decision | outside |
| `packages/@gateway/npm/src/typescript/` | wrap `getImpliedNodeFormatForFile` | outside |
| `packages/@gateway/node/src/child_process/` | it has `run` and `spawn-*` wrappers but no `fork`; one of them must start `process.execPath` with the flag | outside |
| `packages/core/src/brokers/run/unit/run-unit-broker.ts` | decide the format, pass it to the shim and the runner | outside |
| `packages/core/src/transformers/assemble-shim/assemble-shim-transformer.ts` | the ESM test file | outside |
| `packages/core/src/brokers/case/resolve-entry/case-resolve-entry-broker.ts` | async `requireFresh` | outside |
| `packages/core/src/brokers/case/interpret/case-interpret-broker.ts` | await the entry, if resolve-entry turns async | outside |
| `packages/core/CLAUDE.md` section 8 | one config per format, not one config | outside |
| `scrolls/brands-gateways-epic/EPIC.md` concession 19 | state the per-format override | yes |
| CommonJS and ESM integration fixtures beside `run-unit-broker.integration.test.ts` | new | yes |

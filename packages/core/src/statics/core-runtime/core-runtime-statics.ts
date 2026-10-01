/**
 * PURPOSE: The one place the file names of core's run-time modules, and the fixed settings of the
 *   wrapped runner, live. The wrapped runner is the nested Jest that `runUnitBroker` starts, in a worker
 *   process of its own. `coreRuntimeTransformer` is the only reader of the paths here, and
 *   `runExecuteCasesBroker` reads the runner settings. Moving a run-time module means editing this file
 *   and nothing else on that route.
 *
 *   `trees` names the two copies of core a run can load: TypeScript `source`, or compiled `dist`.
 *   `ceremony` names the plain-JS files at core's package root, which Node or Jest loads as file paths in
 *   both trees. `compiler` is the TypeScript ts-jest compiles with: the copy ts-morph bundles. `resolver`
 *   is the Jest resolver that resolves a relative import the way TypeScript does. `runner` is the worker
 *   process's entry, which runs Jest. `modules` names the typed modules, relative to the tree's root,
 *   with no extension. `jestGlobal` names the global the nested Jest config sets for the setup file to
 *   read. `sourceExportConditions` is Jest's node default plus `source`, set only when the run loads
 *   source.
 *
 *   `moduleFormats` are the two ways a consumer's code runs: as CommonJS or as ES modules.
 *   `shimFile` is the generated test file's name per format. The extension fixes the format, so Jest
 *   never reads it off a consumer's `package.json`. `esmExtensions` are the source extensions an ESM run
 *   loads as ES modules.
 *
 *   `tsJestCompilerOptions` overrides the consumer's tsconfig inside ts-jest, per format. Neither
 *   `module` is a node kind (`node16`, `node18`, `nodenext`). A node kind with `isolatedModules` sends
 *   ts-jest to its own transpile path, which compiles with the installed `typescript` package instead of
 *   `compiler`. `esModuleInterop` is on for ESM because ts-jest turns it on for an ESM compile anyway and
 *   warns on stderr when the tsconfig leaves it off.
 *
 *   `workerExecArgv` are the Node flags the worker process starts with, per format. Jest runs an ES
 *   module only through `vm.SourceTextModule`, which Node puts behind `--experimental-vm-modules`, so an
 *   ESM worker starts with that flag. The warning Node prints for it is silenced, because runner output
 *   never reaches a human. A CommonJS worker starts with no flag, because the flag costs about 100 ms on
 *   every run, ESM or not (measured in PE-3).
 *
 * USAGE:
 * coreRuntimeStatics.modules.interpretCase;
 * // 'src/brokers/case/interpret/case-interpret-broker'
 */
export const coreRuntimeStatics = {
  trees: ['source', 'dist'],
  layout: {
    distFolder: 'dist',
  },
  jestGlobal: {
    name: '__assayerCoreRuntime',
  },
  ceremony: {
    setupFile: 'probe-runtime.js',
    astTransformer: 'probe-transformer.js',
    registrar: 'harness-registrar.js',
    compiler: 'bundled-typescript.js',
    resolver: 'ts-resolver.js',
    runner: 'run-jest.js',
  },
  modules: {
    interpretCase: 'src/brokers/case/interpret/case-interpret-broker',
    resolveEntry: 'src/brokers/case/resolve-entry/case-resolve-entry-broker',
    probeRuntime: 'src/brokers/probe-runtime/create/probe-runtime-create-broker',
    probeInject: 'src/transformers/probe-inject/probe-inject-transformer',
    harness: 'index',
  },
  sourceExportConditions: ['source', 'node', 'node-addons'],
  moduleFormats: ['commonjs', 'esm'],
  shimFile: {
    commonjs: 'assayer.test.cjs',
    esm: 'assayer.test.mjs',
  },
  esmExtensions: ['.ts', '.tsx'],
  tsJestCompilerOptions: {
    commonjs: {
      module: 'commonjs',
    },
    esm: {
      module: 'esnext',
      esModuleInterop: true,
    },
  },
  workerExecArgv: {
    commonjs: [],
    esm: ['--experimental-vm-modules', '--no-warnings=ExperimentalWarning'],
  },
} as const;

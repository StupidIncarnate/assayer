/**
 * PURPOSE: The one place the file names of core's run-time modules live. The wrapped runner (the nested
 *   Jest that `runUnitBroker` starts) loads these modules, and `coreRuntimeTransformer` is the only reader
 *   of the paths here. Moving a run-time module means editing this file and nothing else on that route.
 *
 *   `trees` names the two copies of core a run can load: TypeScript `source`, or compiled `dist`.
 *   `ceremony` names the three plain-JS files at core's package root, which Jest needs as file paths in
 *   both trees. `modules` names the typed modules, relative to the tree's root, with no extension.
 *   `jestGlobal` names the global the nested Jest config sets for the ceremony files to read.
 *   `sourceExportConditions` is Jest's node default plus `source`, set only when the run loads source.
 *
 * USAGE:
 * coreRuntimeStatics.modules.interpretCase;
 * // 'src/adapters/jest/interpret-case/jest-interpret-case-adapter'
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
  },
  modules: {
    interpretCase: 'src/adapters/jest/interpret-case/jest-interpret-case-adapter',
    resolveEntry: 'src/adapters/jest/resolve-entry/jest-resolve-entry-adapter',
    probeRuntime: 'src/adapters/jest/probe-runtime/jest-probe-runtime-adapter',
    probeInject: 'src/adapters/jest/probe-inject/jest-probe-inject-adapter',
    harness: 'index',
  },
  sourceExportConditions: ['source', 'node', 'node-addons'],
} as const;

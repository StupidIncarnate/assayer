/**
 * PURPOSE: The RUN-side registrar a colocated harness registers into — the twin of the sandbox
 *   `typescript-load-harness-adapter` binds at compile time. Jest maps `@assayer/core` to this file for
 *   the duration of a run, so the harness's own `import { assayerHarness } from '@assayer/core'` reaches
 *   a collector this process owns, whatever copy of the package the harness would otherwise resolve.
 *
 *   The mapping is what makes the read deterministic. Resolving `@assayer/core` from the harness and
 *   from the shim can land on two different installs in a workspace, and two module instances mean a
 *   registration nobody collects and every key reported missing. One mapped path is one instance.
 *
 *   It validates through the PUBLISHED `assayerHarness` and nothing else, so the declaration a compile
 *   recorded keys for and the declaration a run resolves values from cannot disagree about what the file
 *   said. Everything here is ceremony: plain JS at the package root — alongside the barrels — because
 *   Jest maps to a path on disk, and the behaviour lives in the typed, unit-tested code it delegates to.
 *
 * USAGE:
 * // jest config: moduleNameMapper: { '^@assayer/core$': '<core>/harness-registrar.js' }
 * // shim: require(harnessPath); harnessRegistrar.declarations // what its body registered
 */
const { assayerHarness } = require('./dist/index');

const declarations = [];

exports.assayerHarness = (declaration) => {
  const validated = assayerHarness(declaration);

  declarations.push(validated);

  return validated;
};

exports.declarations = declarations;

/**
 * PURPOSE: The RUN-side registrar a colocated harness registers into — the twin of the sandbox
 *   `harness-load-broker` binds at compile time. Jest maps `@assayer/core` to this file for
 *   the duration of a run, so the harness's own `import { assayerHarness } from '@assayer/core'` reaches
 *   a collector this process owns, whatever copy of the package the harness would otherwise resolve.
 *
 *   The mapping is what makes the read deterministic. Resolving `@assayer/core` from the harness and
 *   from the shim can land on two different installs in a workspace, and two module instances mean a
 *   registration nobody collects and every key reported missing. One mapped path is one instance.
 *
 *   It validates through the PUBLISHED `assayerHarness` and nothing else, so the declaration a compile
 *   recorded keys for and the declaration a run resolves values from cannot disagree about what the file
 *   said. The generated test file loads that typed, unit-tested `assayerHarness` itself and hands it over
 *   through `bindValidator` before it loads the harness. This file loads nothing on its own, because it is
 *   CommonJS and an ESM run loads core's TypeScript source as ES modules, which a `require` cannot load.
 *   This file is plain JS at the package root because Jest maps to a path on disk.
 *
 * USAGE:
 * // jest config: moduleNameMapper: { '^@assayer/core$': '<core>/harness-registrar.js' }
 * // shim: harnessRegistrar.bindValidator(require('<core>/index')); load the harness; harnessRegistrar.declarations
 */
const bound = { validate: undefined };

const declarations = [];

// Takes core's main module, or any object carrying its `assayerHarness`.
exports.bindValidator = ({ assayerHarness }) => {
  bound.validate = assayerHarness;
};

exports.assayerHarness = (declaration) => {
  if (bound.validate === undefined) {
    throw new Error(
      "assayer: harness-registrar.js received a harness registration before the generated test file bound the validator. Only Assayer's own runner loads this file, and its generated test file binds it before loading any harness.",
    );
  }

  const validated = bound.validate(declaration);

  declarations.push(validated);

  return validated;
};

exports.declarations = declarations;

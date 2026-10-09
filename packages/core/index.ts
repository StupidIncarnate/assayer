/**
 * PURPOSE: The MAIN barrel for @assayer/core — the surface a consumer's own code imports. Today that is
 *   the harness artifact and nothing else: `assayerHarness`, the registration seam a colocated
 *   `<basename>.harness.ts` calls, and `HarnessDeclarationInput`, the published type its argument is
 *   checked against. `HarnessDeclaration` is the validated result it returns.
 *
 *   It is deliberately narrow. Every other subpath (`./brokers`, `./adapters`, `./contracts`,
 *   `./transformers`, `./testing`) is Assayer's own plumbing, and the bare specifier is what the input-gap
 *   invoice tells a reader to import — so the remedy it names resolves.
 *
 * USAGE:
 * import { assayerHarness } from '@assayer/core';
 * assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });
 */

// Main export entry for @assayer/core

export { assayerHarnessTransformer as assayerHarness } from './src/transformers/assayer-harness/assayer-harness-transformer';

export type {
  HarnessDeclaration,
  HarnessDeclarationInput,
} from './src/contracts/harness-declaration/harness-declaration-contract';

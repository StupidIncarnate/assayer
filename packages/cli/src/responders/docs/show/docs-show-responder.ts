/**
 * PURPOSE: Handles `assayer docs <topic>` — resolves the topic to its documentation body as
 *   CLI output. Lets the unknown-topic error propagate to the entry point.
 *
 * USAGE:
 * DocsShowResponder({ topic: 'overview' });
 * // Returns CliOutput with the topic body; throws on an unknown topic
 */
import { assayerCoreDocsAdapter } from '../../../adapters/assayer-core/docs/assayer-core-docs-adapter';
import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const DocsShowResponder = ({ topic }: { topic: string }): CliOutput => {
  const docs = assayerCoreDocsAdapter({ topic });

  return cliOutputContract.parse(docs.body);
};

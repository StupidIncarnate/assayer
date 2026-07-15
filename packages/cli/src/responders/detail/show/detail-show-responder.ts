/**
 * PURPOSE: Handles `assayer detail <runId>` — prints one saved run in full: every case's trace, the
 *   leaf that decided it, and the exit it reached.
 *
 *   This is the other end of the link every failing `assayer unit` report prints. The plan is
 *   emphatic that if the hop from "a case failed" to "here is exactly why" is not one step, the
 *   review backstop stops being used — so the id in the report is the id this takes.
 *
 *   An unknown id is an exact-output error naming the id and how to produce one, never an empty
 *   print: silence would read as "that run passed with nothing in it".
 *
 * USAGE:
 * await DetailShowResponder({ configDir: '/repo', argv: ['abc123'] });
 * // Returns the full trace text, or throws naming the unknown id
 */
import { runLoadBroker } from '@assayer/core/brokers';

import { utilParseArgsAdapter } from '../../../adapters/util/parse-args/util-parse-args-adapter';
import { runDetailFormatTransformer } from '../../../transformers/run-detail-format/run-detail-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const DetailShowResponder = async ({
  configDir,
  argv,
}: {
  configDir: string;
  argv: readonly string[];
}): Promise<CliOutput> => {
  const [runId] = utilParseArgsAdapter({ argv }).map(String);

  if (runId === undefined) {
    throw new CliExactOutputError({ message: 'assayer detail: no run id given.\n\nUsage: assayer detail <runId>' });
  }

  const run = await runLoadBroker({ configDir, runId });

  if (run === undefined) {
    throw new CliExactOutputError({
      message:
        `assayer detail: no saved run with id '${runId}'.\n\n` +
        'Runs live in .assayer/cache/runs and are disposable — clearing the cache removes them.\n' +
        'Produce one with: assayer unit <path...>',
    });
  }

  return runDetailFormatTransformer({ run });
};

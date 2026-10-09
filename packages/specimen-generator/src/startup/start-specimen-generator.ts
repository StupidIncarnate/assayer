/**
 * PURPOSE: The generator's startup. It hands the command line and the repo root to the generate
 * flow and returns what the flow answers, so the entry file only has to print it.
 *
 * USAGE:
 * const { exitCode, output } = StartSpecimenGenerator({ argv: ['--check'], repoRoot: '/repo' });
 * // exitCode is 0 when smoke-repo is current
 */
import type { GenerateRunResult } from '../contracts/generate-run-result/generate-run-result-contract';
import { GenerateFlow } from '../flows/generate/generate-flow';

export const StartSpecimenGenerator = ({
  argv,
  repoRoot,
}: {
  argv: readonly string[];
  repoRoot: string;
}): GenerateRunResult => GenerateFlow({ argv, repoRoot });

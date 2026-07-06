/**
 * PURPOSE: assayer CLI startup — delegates argv routing to the assayer flow and returns the CLI
 *   output for the entry point to write. Threads the target repo path for the launch action.
 *
 * USAGE:
 * StartAssayer({ argv: ['status'], repoPath: process.cwd() });
 * // Returns the routed CliOutput
 */
import { AssayerFlow } from '../flows/assayer/assayer-flow';
import type { CliOutput } from '../contracts/cli-output/cli-output-contract';

export const StartAssayer = ({
  argv,
  repoPath,
}: {
  argv: readonly string[];
  repoPath: string;
}): CliOutput => AssayerFlow({ argv, repoPath });

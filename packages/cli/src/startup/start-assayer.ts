/**
 * PURPOSE: assayer CLI startup — a pure async passthrough that delegates argv routing to the
 *   assayer flow and returns the flow's CliOutput for the entry point to write. The flow runs the
 *   async precheck for non-exempt commands, so startup only forwards its arguments and result.
 *
 * USAGE:
 * await StartAssayer({ argv: ['status'], repoPath: process.cwd() });
 * // Returns the routed CliOutput (after the flow's precheck, when applicable)
 */
import { AssayerFlow } from '../flows/assayer/assayer-flow';
import type { CliOutput } from '../contracts/cli-output/cli-output-contract';

export const StartAssayer = async ({
  argv,
  repoPath,
}: {
  argv: readonly string[];
  repoPath: string;
}): Promise<CliOutput> => AssayerFlow({ argv, repoPath });

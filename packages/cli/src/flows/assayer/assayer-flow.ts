/**
 * PURPOSE: Routes an `assayer` invocation's argv to the matching responder and returns its CLI
 *   output. No subcommand opens the desktop app scoped to the target repo.
 *
 * USAGE:
 * AssayerFlow({ argv: ['status'], repoPath: process.cwd() });
 * // Returns CliOutput for the routed command
 */
import { StatusShowResponder } from '../../responders/status/show/status-show-responder';
import { DocsShowResponder } from '../../responders/docs/show/docs-show-responder';
import { LaunchRunResponder } from '../../responders/launch/run/launch-run-responder';
import { cliOutputContract } from '../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../contracts/cli-output/cli-output-contract';

export const AssayerFlow = ({
  argv,
  repoPath,
}: {
  argv: readonly string[];
  repoPath: string;
}): CliOutput => {
  const [command, ...rest] = argv;

  if (command === 'status') {
    return StatusShowResponder();
  }

  if (command === 'docs') {
    const [topic] = rest;

    if (topic === undefined) {
      return cliOutputContract.parse('Usage: assayer docs <topic>');
    }

    return DocsShowResponder({ topic });
  }

  return LaunchRunResponder({ repoPath });
};

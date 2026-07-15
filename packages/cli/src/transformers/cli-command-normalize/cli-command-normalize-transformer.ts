/**
 * PURPOSE: Normalizes the first argv argument passed to `assayer` into a CliCommand — the
 *   closed set of responders the flow can route to. Recognizes help/version/docs/status
 *   aliases, classifies a missing argument as a bare launch, and anything else as unknown.
 *
 * USAGE:
 * cliCommandNormalizeTransformer({ arg: '--help' });
 * // Returns 'help' as branded CliCommand
 *
 * cliCommandNormalizeTransformer({});
 * // Returns 'bare' as branded CliCommand
 */
import { cliCommandContract } from '../../contracts/cli-command/cli-command-contract';
import type { CliCommand } from '../../contracts/cli-command/cli-command-contract';

export const cliCommandNormalizeTransformer = ({ arg }: { arg?: string }): CliCommand => {
  if (arg === 'help' || arg === '--help' || arg === '-h') {
    return cliCommandContract.parse('help');
  }

  if (arg === 'version' || arg === '--version' || arg === '-v') {
    return cliCommandContract.parse('version');
  }

  if (arg === 'docs') {
    return cliCommandContract.parse('docs');
  }

  if (arg === 'status') {
    return cliCommandContract.parse('status');
  }

  if (arg === 'unit') {
    return cliCommandContract.parse('unit');
  }

  if (arg === 'detail') {
    return cliCommandContract.parse('detail');
  }

  if (arg === undefined) {
    return cliCommandContract.parse('bare');
  }

  return cliCommandContract.parse('unknown');
};

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
import type { CliCommand } from '../../contracts/cli-command/cli-command-contract';

export const cliCommandNormalizeTransformer = ({ arg }: { arg?: string }): CliCommand => {
  if (arg === 'help' || arg === '--help' || arg === '-h') {
    return 'help';
  }

  if (arg === 'version' || arg === '--version' || arg === '-v') {
    return 'version';
  }

  if (arg === 'docs') {
    return 'docs';
  }

  if (arg === 'status') {
    return 'status';
  }

  if (arg === 'unit') {
    return 'unit';
  }

  if (arg === 'detail') {
    return 'detail';
  }

  if (arg === undefined) {
    return 'bare';
  }

  return 'unknown';
};

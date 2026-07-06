/**
 * PURPOSE: Handles bare `assayer` (no subcommand) — opens the Electron desktop app scoped to the
 *   target repo and returns a confirmation line.
 *
 * USAGE:
 * LaunchRunResponder({ repoPath: process.cwd() });
 * // Spawns the desktop app; returns CliOutput
 */
import { assayerDesktopLaunchAdapter } from '../../../adapters/assayer-desktop/launch/assayer-desktop-launch-adapter';
import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const LaunchRunResponder = ({ repoPath }: { repoPath: string }): CliOutput => {
  assayerDesktopLaunchAdapter({ repoPath });

  return cliOutputContract.parse(`Opening the Assayer desktop app for ${repoPath}...`);
};

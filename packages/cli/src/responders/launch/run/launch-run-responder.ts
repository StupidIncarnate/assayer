/**
 * PURPOSE: Handles bare `assayer` (no subcommand) — opens the Electron desktop app scoped to the
 *   target repo (via the desktop launch broker) and returns a confirmation line.
 *
 * USAGE:
 * LaunchRunResponder({ repoPath: process.cwd() });
 * // Spawns the desktop app; returns CliOutput
 */
import { desktopLaunchBroker } from '@assayer/desktop/brokers';

import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const LaunchRunResponder = ({ repoPath }: { repoPath: string }): CliOutput => {
  desktopLaunchBroker({ repoPath });

  return cliOutputContract.parse(`Opening the Assayer desktop app for ${repoPath}...`);
};

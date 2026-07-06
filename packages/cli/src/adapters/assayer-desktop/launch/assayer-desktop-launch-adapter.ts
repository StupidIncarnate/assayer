/**
 * PURPOSE: Adapter boundary to the @assayer/desktop launch seam — lets the CLI's default action
 *   open the Electron window without a direct cross-package import in a responder.
 *
 * USAGE:
 * assayerDesktopLaunchAdapter({ repoPath: process.cwd() });
 * // Spawns the desktop app; returns { success: true }
 */
import { desktopLaunchBroker } from '@assayer/desktop/brokers';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const assayerDesktopLaunchAdapter = ({ repoPath }: { repoPath: string }): AdapterResult =>
  desktopLaunchBroker({ repoPath });

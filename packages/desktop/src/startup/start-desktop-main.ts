/**
 * PURPOSE: Desktop main-process startup — delegates to the desktop main flow.
 *
 * USAGE:
 * await StartDesktopMain({ repoPath });
 * // Boots the Electron main process
 */

import { DesktopMainFlow } from '../flows/desktop-main/desktop-main-flow';

export const StartDesktopMain = async ({ repoPath }: { repoPath: string }): Promise<void> =>
  DesktopMainFlow({ repoPath });

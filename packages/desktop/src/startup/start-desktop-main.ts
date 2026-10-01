/**
 * PURPOSE: Desktop main-process startup — delegates to the desktop main flow.
 *
 * USAGE:
 * await StartDesktopMain({ repoPath });
 * // Boots the Electron main process
 */

import { DesktopMainFlow } from '../flows/desktop-main/desktop-main-flow';
import type { RepoPath } from '../contracts/repo-path/repo-path-contract';

export const StartDesktopMain = async ({ repoPath }: { repoPath: RepoPath }): Promise<void> =>
  DesktopMainFlow({ repoPath });

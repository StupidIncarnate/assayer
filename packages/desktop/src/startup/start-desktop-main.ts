/**
 * PURPOSE: Desktop main-process startup — delegates to the desktop main flow.
 *
 * USAGE:
 * await StartDesktopMain({ repoPath });
 * // Boots the Electron main process
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { DesktopMainFlow } from '../flows/desktop-main/desktop-main-flow';
import type { RepoPath } from '../contracts/repo-path/repo-path-contract';

export const StartDesktopMain = async ({ repoPath }: { repoPath: RepoPath }): Promise<AdapterResult> =>
  DesktopMainFlow({ repoPath });

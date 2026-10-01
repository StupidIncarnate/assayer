/**
 * PURPOSE: Routes desktop main-process startup to the boot responder.
 *
 * USAGE:
 * await DesktopMainFlow({ repoPath });
 * // Boots the Electron main process
 */

import { DesktopMainBootResponder } from '../../responders/desktop-main/boot/desktop-main-boot-responder';
import type { RepoPath } from '../../contracts/repo-path/repo-path-contract';

export const DesktopMainFlow = async ({ repoPath }: { repoPath: RepoPath }): Promise<void> =>
  DesktopMainBootResponder({ repoPath });

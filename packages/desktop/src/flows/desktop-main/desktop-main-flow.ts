/**
 * PURPOSE: Routes desktop main-process startup to the boot responder.
 *
 * USAGE:
 * await DesktopMainFlow({ repoPath });
 * // Boots the Electron main process
 */

import { DesktopMainBootResponder } from '../../responders/desktop-main/boot/desktop-main-boot-responder';

export const DesktopMainFlow = async ({ repoPath }: { repoPath: string }): Promise<void> =>
  DesktopMainBootResponder({ repoPath });

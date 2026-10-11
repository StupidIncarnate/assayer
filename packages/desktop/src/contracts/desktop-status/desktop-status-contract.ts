/**
 * PURPOSE: The status payload the desktop main process returns over IPC — core version +
 *   readiness message, and the target repo path. Validated by the renderer's StatusView.
 *
 * USAGE:
 * desktopStatusContract.parse({ version: '1.0.0', message: 'Assayer core online', repoPath: '/repo' });
 * // Returns a validated DesktopStatus (branded fields)
 */
import { z } from '#gateway/npm/zod';


export const desktopStatusContract = z.object({
  version: z.string().min(1).brand<'DesktopStatusVersion'>(),
  message: z.string().min(1).brand<'DesktopStatusMessage'>(),
  repoPath: z.string().min(1).brand<'DesktopStatusRepoPath'>(),
}).brand<'DesktopStatus'>();

export type DesktopStatus = z.infer<typeof desktopStatusContract>;

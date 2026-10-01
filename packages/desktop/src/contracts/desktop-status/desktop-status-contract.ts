/**
 * PURPOSE: The status payload the desktop main process returns over IPC — core version +
 *   readiness message, the target repo path, and the repo's `runMode`. Validated by the renderer's
 *   StatusView. `runMode` is display-only (`thorough` shows every case live, `intelligent` grays the
 *   non-salient breadth) and rides the status handshake because the config is not on the serve path.
 *
 * USAGE:
 * desktopStatusContract.parse({ version: '1.0.0', message: 'Assayer core online', repoPath: '/repo' });
 * // Returns a validated DesktopStatus (branded fields; runMode defaults to 'thorough')
 */
import { z } from '#gateway/npm/zod';


export const desktopStatusContract = z.object({
  version: z.string().min(1).brand<'DesktopStatusVersion'>(),
  message: z.string().min(1).brand<'DesktopStatusMessage'>(),
  repoPath: z.string().min(1).brand<'DesktopStatusRepoPath'>(),
  runMode: z.enum(['thorough', 'intelligent']).default('thorough'),
}).brand<'DesktopStatus'>();

export type DesktopStatus = z.infer<typeof desktopStatusContract>;

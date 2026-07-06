/**
 * PURPOSE: The status payload the desktop main process returns over IPC — core version +
 *   readiness message plus the target repo path. Validated by the renderer's StatusView.
 *
 * USAGE:
 * desktopStatusContract.parse({ version: '1.0.0', message: 'Assayer core online', repoPath: '/repo' });
 * // Returns a validated DesktopStatus (branded fields)
 */
import { z } from 'zod';

import { repoPathContract } from '../repo-path/repo-path-contract';

export const desktopStatusContract = z.object({
  version: z.string().min(1).brand<'AssayerVersion'>(),
  message: z.string().min(1).brand<'StatusMessage'>(),
  repoPath: repoPathContract,
});

export type DesktopStatus = z.infer<typeof desktopStatusContract>;

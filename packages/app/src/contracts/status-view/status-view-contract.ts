/**
 * PURPOSE: The renderer's view model for the assayer status handshake — version, readiness
 *   message, the target repo path the desktop app was launched against, and the repo's `runMode`.
 *   `runMode` is display-only: `thorough` shows every derived case live, `intelligent` grays the
 *   non-salient breadth. It arrives over the status payload because the config is not on the serve path.
 *
 * USAGE:
 * statusViewContract.parse({ version: '1.0.0', message: 'Assayer core online', repoPath: '/repo' });
 * // Returns a validated StatusView (branded fields; runMode defaults to 'thorough')
 */
import { z } from 'zod';

export const statusViewContract = z.object({
  version: z.string().min(1).brand<'AssayerVersion'>(),
  message: z.string().min(1).brand<'StatusMessage'>(),
  repoPath: z.string().min(1).brand<'RepoPath'>(),
  runMode: z.enum(['thorough', 'intelligent']).default('thorough').brand<'RunMode'>(),
});

export type StatusView = z.infer<typeof statusViewContract>;
export type RunMode = StatusView['runMode'];

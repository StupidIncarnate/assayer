/**
 * PURPOSE: The renderer's view model for the assayer status handshake — version, readiness
 *   message, and the target repo path the desktop app was launched against.
 *
 * USAGE:
 * statusViewContract.parse({ version: '1.0.0', message: 'Assayer core online', repoPath: '/repo' });
 * // Returns a validated StatusView (branded fields)
 */
import { z } from 'zod';

export const statusViewContract = z.object({
  version: z.string().min(1).brand<'AssayerVersion'>(),
  message: z.string().min(1).brand<'StatusMessage'>(),
  repoPath: z.string().min(1).brand<'RepoPath'>(),
});

export type StatusView = z.infer<typeof statusViewContract>;

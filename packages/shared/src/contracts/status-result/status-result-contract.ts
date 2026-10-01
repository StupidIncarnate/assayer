/**
 * PURPOSE: Contract for the assayer "status" payload, produced by core and surfaced by the
 *   CLI, the desktop IPC bridge, and the UI. One source of truth for the handshake shape.
 *
 * USAGE:
 * statusResultContract.parse({ version: '1.0.0', message: 'Assayer core online' });
 * // Returns a validated StatusResult (branded fields)
 */
import { z } from '#gateway/npm/zod';

export const statusResultContract = z.object({
  version: z.string().min(1).brand<'StatusResultVersion'>(),
  message: z.string().min(1).brand<'StatusResultMessage'>(),
}).brand<'StatusResult'>();

export type StatusResult = z.infer<typeof statusResultContract>;

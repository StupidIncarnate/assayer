/**
 * PURPOSE: Contract for a content hash (SHA-256 hex digest) that keys the content-hash cache
 *   for deterministic derived-artifact lookups.
 *
 * USAGE:
 * const hash = contentHashContract.parse(
 *   'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
 * );
 * // Returns a validated ContentHash (branded)
 */
import { z } from 'zod';

export const contentHashContract = z
  .string()
  .regex(/^[0-9a-f]{64}$/u)
  .brand<'ContentHash'>();

export type ContentHash = z.infer<typeof contentHashContract>;

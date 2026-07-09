/**
 * PURPOSE: Contract for a repo-relative file path (relative to the repo root), non-empty.
 *
 * USAGE:
 * const path = relPathContract.parse('packages/shared/src/index.ts');
 * // Returns a validated RelPath (branded)
 */
import { z } from 'zod';

export const relPathContract = z.string().min(1).brand<'RelPath'>();

export type RelPath = z.infer<typeof relPathContract>;

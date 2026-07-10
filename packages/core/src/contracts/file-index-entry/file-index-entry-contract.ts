/**
 * PURPOSE: Contract for a single entry in the repo file index — the repo-relative path of a
 *   discovered file.
 *
 * USAGE:
 * fileIndexEntryContract.parse({ relPath: 'packages/core/src/index.ts' });
 * // Returns a validated FileIndexEntry (branded relPath field)
 */
import { z } from 'zod';

import { relPathContract } from '@assayer/shared/contracts';

export const fileIndexEntryContract = z.object({
  relPath: relPathContract,
});

export type FileIndexEntry = z.infer<typeof fileIndexEntryContract>;

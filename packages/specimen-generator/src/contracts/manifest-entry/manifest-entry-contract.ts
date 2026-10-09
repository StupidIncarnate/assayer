/**
 * PURPOSE: One row of the specimen manifest: which syntax, container, slot and provenance built a
 * specimen, and whether Assayer is expected to drive it. Reach for this when a file needs to list
 * or look up generated specimens.
 *
 * USAGE:
 * manifestEntryContract.parse({ folder: 'if-number-function-declaration-body-cond-gt-number-value-param', relPath: 'packages/syntax-repository/src/if/function-declaration/x/x.ts', focus: 'if', container: 'function-declaration', slot: 'body', path: '', provenance: 'param', uses: ['if'], verdict: 'driven' });
 * // Returns a ManifestEntry
 */
import { z } from '#gateway/npm/zod';

import { provenanceContract } from '../provenance/provenance-contract';

export const manifestEntryContract = z
  .object({
    folder: z.string().min(1).brand<'ManifestEntryFolder'>(),
    relPath: z.string().min(1).brand<'ManifestEntryRelPath'>(),
    focus: z.string().min(1).brand<'ManifestEntryFocus'>(),
    container: z.string().min(1).brand<'ManifestEntryContainer'>(),
    slot: z.string().min(1).brand<'ManifestEntrySlot'>(),
    path: z.string().brand<'ManifestEntryPath'>(),
    provenance: provenanceContract,
    uses: z.array(z.string().min(1).brand<'ManifestEntryUses'>()),
    verdict: z.enum(['driven', 'locked', 'undriven']),
  })
  .brand<'ManifestEntry'>();

export type ManifestEntry = z.infer<typeof manifestEntryContract>;

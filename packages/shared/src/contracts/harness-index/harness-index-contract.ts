/**
 * PURPOSE: Contract for the harness index — the DERIVED, per-namespace product of the harness stitch:
 *   every colocated `<basename>.harness.ts` that registers with Assayer, the source file it applies to,
 *   and the sorted (entry, parameter) keys it declares values for. A TWIN of the resolved and stub
 *   indexes, written atomically to `.assayer/cache/harness/<namespace>.json`.
 *
 *   It carries a THIRD hash the others do not. `layoutHash` and `tsconfigHash` move when the analysed
 *   file set or the tsconfig moves, and a harness is in NEITHER — it is classified out of the analysed
 *   surface, so editing one leaves both unmoved. `harnessHash` digests the harness files' own paths and
 *   content, which is what makes a harness-only edit rebuild this index and nothing else.
 *
 *   Only KEYS are cached. The values a harness declares are callbacks and instances that do not
 *   serialize, and the run resolves them by loading the same file again — so the cache holds what is
 *   stable and the run holds what is live, with no second encoding of either.
 *
 * USAGE:
 * harnessIndexContract.parse({
 *   layoutHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   tsconfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   harnessHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   harnesses: [],
 * });
 * // Returns a validated HarnessIndex (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { contentHashContract } from '../content-hash/content-hash-contract';
import { harnessFileContract } from '../harness-file/harness-file-contract';

export const harnessIndexContract = z.object({
  layoutHash: contentHashContract,
  tsconfigHash: contentHashContract,
  harnessHash: contentHashContract,
  harnesses: z.array(harnessFileContract),
}).brand<'HarnessIndex'>();

export type HarnessIndex = z.infer<typeof harnessIndexContract>;

/**
 * PURPOSE: Contract for one committed HARNESS FILE in the derived harness index — the colocated
 *   `<basename>.harness.ts` that closes input gaps, the source file it applies to, and the sorted
 *   (entry, parameter) keys it declares values for.
 *
 *   `relPath` and `targetRelPath` are separate facts and neither is derivable from the other at read
 *   time: the harness is always `.ts` even beside a `.tsx`, so the pairing is decided once, when the
 *   file is classified, and recorded. `keys` are sorted so the same declaration always serializes to
 *   the same bytes.
 *
 * USAGE:
 * harnessFileContract.parse({
 *   relPath: 'src/audit.harness.ts',
 *   targetRelPath: 'src/audit.ts',
 *   keys: [{ entry: 'audit', param: 'report' }],
 * });
 * // Returns a validated HarnessFile (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { harnessInputKeyContract } from '../harness-input-key/harness-input-key-contract';

export const harnessFileContract = z.object({
  relPath: z.string().min(1).brand<'HarnessFileRelPath'>(),
  targetRelPath: z.string().min(1).brand<'HarnessFileTargetRelPath'>(),
  keys: z.array(harnessInputKeyContract),
}).brand<'HarnessFile'>();

export type HarnessFile = z.infer<typeof harnessFileContract>;

/**
 * PURPOSE: Contract for the resolved index — the DERIVED, per-namespace product of the stitch pass:
 *   every import in the file set reconciled to its canonical definition. It is not content-keyed like
 *   a blob but keyed on `layoutHash` (a hash of the repo's file→content layout) and `tsconfigHash`, so
 *   it rebuilds whenever the file set or tsconfig changes and a pure file move re-resolves rather than
 *   going stale. `edges` are the resolved local/package/builtin edges; broken imports never reach here
 *   (they are hard build errors).
 *
 * USAGE:
 * resolvedIndexContract.parse({
 *   layoutHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   tsconfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 *   edges: [],
 * });
 * // Returns a validated ResolvedIndex (branded fields)
 */
import { z } from 'zod';

import { contentHashContract } from '../content-hash/content-hash-contract';
import { resolvedEdgeContract } from '../resolved-edge/resolved-edge-contract';

export const resolvedIndexContract = z.object({
  layoutHash: contentHashContract,
  tsconfigHash: contentHashContract,
  edges: z.array(resolvedEdgeContract),
});

export type ResolvedIndex = z.infer<typeof resolvedIndexContract>;

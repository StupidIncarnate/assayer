/**
 * PURPOSE: Contract for a probe plan — every site the instrumenter must wrap in one file, plus the
 *   CONTENT HASH of the source those offsets were computed against.
 *
 *   The hash is the whole safety mechanism. Offsets are formatting-coupled (a reformat moves every
 *   one of them) while coverage IDs must not be, so a plan can never live in the analysis blob or be
 *   diffed. Keying the plan file by content hash makes a stale read unrepresentable rather than
 *   merely unlikely: instrument text whose hash does not match and there is simply no plan to find.
 *   That is invalidation by content — never a version bump.
 *
 * USAGE:
 * probePlanContract.parse({ contentHash: 'a3f…', relPath: 'src/boolean/and.ts', sites: [...] });
 * // Returns a validated ProbePlan
 */
import { z } from 'zod';

import { contentHashContract, relPathContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../probe-site/probe-site-contract';

export const probePlanContract = z.object({
  contentHash: contentHashContract,
  relPath: relPathContract,
  sites: z.array(probeSiteContract),
});

export type ProbePlan = z.infer<typeof probePlanContract>;

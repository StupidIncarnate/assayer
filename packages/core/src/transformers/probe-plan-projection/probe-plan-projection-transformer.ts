/**
 * PURPOSE: Projects the walk into a probe plan — the instrumenter's half of the same model the
 *   analysis projection reads. It is a filter, not a search: the walk already recorded every site as
 *   it assigned that site's coverage ID, so the runtime observation and the static derivation cannot
 *   key differently.
 *
 *   A file that failed to parse yields an EMPTY plan rather than no plan: "analyzed, nothing to wrap"
 *   and "never analyzed" must stay distinguishable, since the second means the instrumenter silently
 *   does nothing.
 *
 * USAGE:
 * probePlanProjectionTransformer({ walked, relPath, contentHash });
 * // Returns { contentHash, relPath, sites: [{ id, kind, start, end }] }
 */
import { probePlanContract } from '../../contracts/probe-plan/probe-plan-contract';
import type { ProbePlan } from '../../contracts/probe-plan/probe-plan-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';

export const probePlanProjectionTransformer = ({
  walked,
  relPath,
  contentHash,
}: {
  walked: WalkFileResult;
  relPath: string;
  contentHash: string;
}): ProbePlan =>
  probePlanContract.parse({
    contentHash,
    relPath,
    sites: walked.success ? walked.probeSites : [],
  });

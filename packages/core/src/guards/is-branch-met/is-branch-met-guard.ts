/**
 * PURPOSE: Answers whether a route reaches a branch: every arm on the branch's own guard path must be
 *   an arm the route already took. A guard step that names a branch outside `knownIds` (one the walk
 *   never handed this entry) never keeps the branch from being met.
 *
 * USAGE:
 * isBranchMetGuard({ branch, taken: [guardStep], knownIds: new Set(['f/if:a']) });
 * // Returns true when the route took every arm the branch is nested in
 */
import type { BranchNode, GuardStep } from "@assayer/shared/contracts";

export const isBranchMetGuard = ({
  branch,
  taken,
  knownIds,
}: {
  branch?: BranchNode;
  taken?: GuardStep[];
  knownIds?: ReadonlySet<string>;
}): boolean =>
  branch !== undefined &&
  taken !== undefined &&
  knownIds !== undefined &&
  branch.guardPath.every(
    (step) =>
      !knownIds.has(String(step.branchCoverageId)) ||
      taken.some(
        (took) =>
          String(took.branchCoverageId) === String(step.branchCoverageId) &&
          String(took.arm) === String(step.arm),
      ),
  );

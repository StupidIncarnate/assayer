/**
 * PURPOSE: Enumerates the full INPUT-BUCKET set of an entry — one bucket per input COMBINATION the
 *   logic distinguishes: the cartesian product of every branch's arms (`then`/`else`, each arm's
 *   short-circuit causes kept distinct) times a branchless predicate's true/false return. Two buckets
 *   that converge onto the same exit are still distinct buckets, which is the breadth a reviewer reads
 *   and the value engine reuses — WIDER than the reachable-exit set `exit-causes` builds.
 *
 *   Each branch contributes an AXIS of arm-causes: the `then` causes (its condition wanted true)
 *   tagged arm `then`, the `else` causes (wanted false) tagged arm `else`. A compound condition fans
 *   its arm into one cause per short-circuit reason, so `a && b`'s else axis carries two. The
 *   `returnPredicate` is one more axis — true/false — tagged with `predWant` and carrying NO branch
 *   arm, so it never joins the exit's guard path; it exists only to split a branchless predicate's two
 *   return values apart on the one exit they share.
 *
 *   Seeded with ONE empty bucket, so a branchless, predicate-less entry still yields exactly one
 *   bucket — the single representative-fill case a signatureless entry owes.
 *
 *   Growth is 2^branches (each branch an axis of two arms); v1 specimens sit at <= 2 branches. A
 *   real-repo file with many independent guards is the ceiling a later rung caps; the enumeration
 *   itself is unbounded here on purpose.
 *
 * USAGE:
 * inputBucketsTransformer({ branches, returnPredicate });
 * // Returns [{ requirements: [{ leaf, want }, …], arms: [{ branchCoverageId, arm }], predWant? }, …]
 */
import { guardStepContract } from '@assayer/shared/contracts';
import type { BranchNode, ConditionNode, GuardStep } from '@assayer/shared/contracts';

import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import { conditionCausesTransformer } from '../condition-causes/condition-causes-transformer';

export const inputBucketsTransformer = ({
  branches,
  returnPredicate,
}: {
  branches: BranchNode[];
  returnPredicate?: ConditionNode;
}): { requirements: ConditionCause['requirements']; arms: GuardStep[]; predWant?: boolean }[] => {
  // One axis per branch: each arm's causes, each cause a partial-bucket option carrying that arm's
  // requirements and the single guard step it takes. `then` = condition wanted true, `else` = false.
  const branchAxes = branches.map((branch) =>
    (['then', 'else'] as const).flatMap((arm) =>
      conditionCausesTransformer({ condition: branch.condition, want: arm === 'then' }).map((cause) => ({
        requirements: cause.requirements,
        arms: [guardStepContract.parse({ branchCoverageId: branch.coverageId, arm })],
      })),
    ),
  );

  // Cross-product over the branch axes alone — no predicate yet, so no predWant. Seeded with ONE empty
  // bucket so a branchless entry still yields exactly one.
  const branchBuckets = branchAxes.reduce<{ requirements: ConditionCause['requirements']; arms: GuardStep[] }[]>(
    (buckets, axis) =>
      buckets.flatMap((bucket) =>
        axis.map((option) => ({
          requirements: [...bucket.requirements, ...option.requirements],
          arms: [...bucket.arms, ...option.arms],
        })),
      ),
    [{ requirements: [], arms: [] }],
  );

  // With no returnPredicate the branch buckets ARE the buckets. Otherwise each is crossed with the
  // predicate's true and false returns — tagged with predWant and carrying NO extra arm, since the
  // return value is not a control-flow branch and never appears on any exit's guard path.
  if (returnPredicate === undefined) {
    return branchBuckets;
  }

  const predicateOptions = [true, false].flatMap((predWant) =>
    conditionCausesTransformer({ condition: returnPredicate, want: predWant }).map((cause) => ({
      requirements: cause.requirements,
      predWant,
    })),
  );

  return branchBuckets.flatMap((bucket) =>
    predicateOptions.map((option) => ({
      requirements: [...bucket.requirements, ...option.requirements],
      arms: bucket.arms,
      predWant: option.predWant,
    })),
  );
};

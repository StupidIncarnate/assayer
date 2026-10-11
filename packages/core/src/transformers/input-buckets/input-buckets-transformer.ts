/**
 * PURPOSE: Enumerates the ROUTES of an entry — one bucket per way execution can travel through it, taking
 *   one arm (`then`/`else`, each arm's short-circuit causes kept distinct) at every branch it MEETS, times
 *   a branchless predicate's true/false return. Two routes that converge onto the same exit are still
 *   distinct buckets, which is the breadth a reviewer reads and the value engine reuses.
 *
 *   A branch is met only when the arms already taken satisfy its own guard path: a branch nested in an
 *   arm is met only on a route that took that arm, and a branch after an early return is met only on a
 *   route that did not return. A route therefore never names an arm of a branch it cannot reach, which
 *   keeps every case's arm labels the arms its input actually takes. Branches are visited in the order
 *   the walk met them, so a branch's enclosing arms are always decided before it.
 *
 *   Each branch contributes an AXIS of arm-causes: the `then` causes (its condition wanted true) tagged
 *   arm `then`, the `else` causes (wanted false) tagged arm `else`. A compound condition fans its arm
 *   into one cause per short-circuit reason, so `a && b`'s else axis carries two. A branch no input can
 *   steer (`unsteerable`) still contributes both arms, with no requirement on either: the route through
 *   it is declared, and the caller marks it undriven. The `returnPredicate` is one more axis, true/false,
 *   tagged with `predWant` and carrying NO branch arm, so it never joins an exit's guard path; it
 *   exists only to split a branchless predicate's two return values apart on the one exit they share.
 *
 *   Seeded with ONE empty bucket, so a branchless, predicate-less entry still yields exactly one bucket
 *   — the single representative-fill case a signatureless entry owes.
 *
 *   Growth is 2^branches over sequential branches. A real-repo file with many independent guards is the
 *   ceiling a later rung caps; the enumeration itself is unbounded here on purpose.
 *
 * USAGE:
 * inputBucketsTransformer({ branches, unsteerable: new Set(), returnPredicate });
 * // Returns [{ requirements: [{ leaf, want }, …], arms: [{ branchCoverageId, arm }], predWant? }, …]
 */
import { inputBucketsContract } from "../../contracts/input-buckets/input-buckets-contract";
import type { InputBuckets } from "../../contracts/input-buckets/input-buckets-contract";
import type { BranchNode, ConditionNode } from "@assayer/shared/contracts";

import { isBranchMetGuard } from "../../guards/is-branch-met/is-branch-met-guard";
import { branchArmOptionsTransformer } from "../branch-arm-options/branch-arm-options-transformer";
import { conditionCausesTransformer } from "../condition-causes/condition-causes-transformer";

export const inputBucketsTransformer = ({
  branches,
  unsteerable = new Set<string>(),
  returnPredicate,
}: {
  branches: BranchNode[];
  unsteerable?: ReadonlySet<string>;
  returnPredicate?: ConditionNode;
}): InputBuckets => {
  // The ids of every branch this entry owns, so a guard step naming a branch outside the list (one the
  // walk never handed this entry) never keeps a branch from being met.
  const knownIds = new Set(branches.map((branch) => String(branch.coverageId)));

  // Every route, one branch at a time in the order the walk met them. A route that does not reach a branch
  // passes it by without taking an arm there.
  const routes = branches.reduce<
    Pick<InputBuckets[number], "arms" | "requirements">[]
  >(
    (partial, branch) =>
      partial.flatMap((route) => {
        const met = isBranchMetGuard({ branch, taken: route.arms, knownIds });

        return met
          ? branchArmOptionsTransformer({ branch, unsteerable }).map(
              (option) => ({
                requirements: [...route.requirements, ...option.requirements],
                arms: [...route.arms, ...option.arms],
              }),
            )
          : [route];
      }),
    [{ requirements: [], arms: [] }],
  );

  // With no returnPredicate the routes ARE the buckets. Otherwise each is crossed with the predicate's
  // true and false returns — tagged with predWant and carrying NO extra arm, since the return value is not
  // a control-flow branch and never appears on any exit's guard path.
  if (returnPredicate === undefined) {
    return inputBucketsContract.parse(routes);
  }

  const predicateOptions = [true, false].flatMap((predWant) =>
    conditionCausesTransformer({
      condition: returnPredicate,
      want: predWant,
    }).map((cause) => ({
      requirements: cause.requirements,
      predWant,
    })),
  );

  return inputBucketsContract.parse(
    routes.flatMap((route) =>
      predicateOptions.map((option) => ({
        requirements: [...route.requirements, ...option.requirements],
        arms: route.arms,
        predWant: option.predWant,
      })),
    ),
  );
};

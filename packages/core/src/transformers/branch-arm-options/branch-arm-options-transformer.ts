/**
 * PURPOSE: Lists the ways a route can take ONE branch: the `then` causes (its condition wanted true)
 *   tagged arm `then`, then the `else` causes tagged arm `else`. A compound condition fans its arm into
 *   one option per short-circuit reason. A branch no input can steer (its id is in `unsteerable`) still
 *   offers both arms, with no requirement on either, so the route through it is declared and the caller
 *   marks it undriven.
 *
 * USAGE:
 * branchArmOptionsTransformer({ branch, unsteerable: new Set() });
 * // Returns [{ requirements: [{ leaf, want: true }], arms: [{ branchCoverageId, arm: 'then' }] }, …]
 */
import { guardStepContract } from "@assayer/shared/contracts";
import type { BranchNode } from "@assayer/shared/contracts";

import type { InputBuckets } from "../../contracts/input-buckets/input-buckets-contract";
import { conditionCausesTransformer } from "../condition-causes/condition-causes-transformer";

export const branchArmOptionsTransformer = ({
  branch,
  unsteerable,
}: {
  branch: BranchNode;
  unsteerable: ReadonlySet<string>;
}): Pick<InputBuckets[number], "arms" | "requirements">[] =>
  (["then", "else"] as const).flatMap((arm) =>
    unsteerable.has(String(branch.coverageId))
      ? [
          {
            requirements: [],
            arms: [
              guardStepContract.parse({
                branchCoverageId: branch.coverageId,
                arm,
              }),
            ],
          },
        ]
      : conditionCausesTransformer({
          condition: branch.condition,
          want: arm === "then",
        }).map((cause) => ({
          requirements: cause.requirements,
          arms: [
            guardStepContract.parse({
              branchCoverageId: branch.coverageId,
              arm,
            }),
          ],
        })),
  );

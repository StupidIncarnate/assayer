/**
 * PURPOSE: Enumerates the distinct CAUSES that reach an exit — the cartesian product of each guard
 *   step's own causes, with their leaf requirements merged. A guard path of two `if`s each satisfiable
 *   two ways reaches its exit four ways, and each is its own case.
 *
 *   It exists so `derive-cases` never has to know how a guard step becomes constraints: an arm is
 *   just a wanted outcome (`else` means the condition must be false), and the condition tree owns the
 *   rest.
 *
 * USAGE:
 * exitCausesTransformer({ branches, guardPath: exit.guardPath });
 * // Returns [{ requirements: [{ leaf, want }, …] }, …] — one entry per distinct reason
 */
import { conditionCauseContract } from '../../contracts/condition-cause/condition-cause-contract';
import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import { conditionCausesTransformer } from '../condition-causes/condition-causes-transformer';
import type { BranchNode, GuardStep } from '@assayer/shared/contracts';

export const exitCausesTransformer = ({
  branches,
  guardPath,
}: {
  branches: BranchNode[];
  guardPath: GuardStep[];
}): ConditionCause[] => {
  const branchById = new Map(branches.map((branch) => [branch.coverageId, branch]));

  // Seeded with ONE empty cause, so an unguarded exit yields exactly one case rather than none.
  return guardPath.reduce<ConditionCause[]>(
    (combos, step) => {
      const branch = branchById.get(step.branchCoverageId);

      if (branch === undefined) {
        return combos;
      }

      const causes = conditionCausesTransformer({
        condition: branch.condition,
        want: step.arm !== 'else',
      });

      return combos.flatMap((combo) =>
        causes.map((cause) =>
          conditionCauseContract.parse({
            requirements: [...combo.requirements, ...cause.requirements],
          }),
        ),
      );
    },
    [conditionCauseContract.parse({ requirements: [] })],
  );
};

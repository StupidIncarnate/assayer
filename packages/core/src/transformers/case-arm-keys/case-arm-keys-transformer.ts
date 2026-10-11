/**
 * PURPOSE: Lists the arms one case takes as plain keys, each naming one branch plus the side taken, with
 *   duplicates removed and the case's own order kept.
 *
 * USAGE:
 * caseArmKeysTransformer({ testCase });
 * // Returns ['f/if:a|then', 'f/if:b|else']
 */
import type { DerivedTestCase } from "@assayer/shared/contracts";

export const caseArmKeysTransformer = ({
  testCase,
}: {
  testCase: DerivedTestCase;
}): string[] => [
  ...new Set(
    testCase.arms.map(
      (step) => `${String(step.branchCoverageId)}|${String(step.arm)}`,
    ),
  ),
];

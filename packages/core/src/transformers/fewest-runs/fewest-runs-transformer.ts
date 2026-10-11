/**
 * PURPOSE: Marks the FEWEST-RUNS subset of an entry's every-route case list: the smallest set of cases
 *   in which every reachable arm is taken by at least one case. Every other case stays in the every-route
 *   set with `fewestRuns: false`. The same entry always yields the same subset.
 *
 *   An arm is one branch plus the side taken (`then`, `else`, a switch case). A case takes the arms its
 *   `arms` list names, so this is a set cover over those arms and nothing about the inputs.
 *
 *   Two passes, so a run never loses an arm it could have taken. The first covers every arm some DRIVEN
 *   case takes, using driven cases only. The second covers the arms only an undriven case takes, using
 *   undriven cases only: those cases are listed and never run, but the set still says which of them it
 *   would take.
 *
 *   Within a pass the cover is the MINIMUM size, found exactly: sizes are tried from one upward, and at
 *   each step the first arm no chosen case yet takes (in the order the cases first meet arms) is covered
 *   by the earliest case, in enumeration order, that takes it. That fixes the tie-break: of two covers of
 *   the same size, the one that reaches the earliest arms with the earliest cases wins. Cases that take
 *   exactly the same arms are one candidate, and the earliest stands for them. A pass over more than
 *   `armCoverStatics.exactCandidateLimit` distinct candidates falls back to greedy (most uncovered arms first, earliest
 *   case on a tie), which is deterministic too.
 *
 *   When no case takes any arm (a branchless entry), the first driven case is the one run.
 *
 * USAGE:
 * fewestRunsTransformer({ cases });
 * // Returns the same cases, each with `fewestRuns` set to whether it is in the smallest arm-covering subset
 */
import { derivedTestCaseContract } from "@assayer/shared/contracts";
import type { DerivedTestCase } from "@assayer/shared/contracts";

import { armCoverPassTransformer } from "../arm-cover-pass/arm-cover-pass-transformer";
import { caseArmKeysTransformer } from "../case-arm-keys/case-arm-keys-transformer";

export const fewestRunsTransformer = ({
  cases,
}: {
  cases: DerivedTestCase[];
}): DerivedTestCase[] => {
  const keys = cases.map((testCase) => caseArmKeysTransformer({ testCase }));
  const drivenIndexes = cases.flatMap((testCase, index) =>
    testCase.driven ? [index] : [],
  );
  const undrivenIndexes = cases.flatMap((testCase, index) =>
    testCase.driven ? [] : [index],
  );

  const drivenPick = armCoverPassTransformer({
    keys,
    candidates: drivenIndexes,
  });
  // Only the arms no driven case takes are left for the undriven cases to cover.
  const drivenArms = new Set(
    drivenIndexes.flatMap((index) => keys[index] ?? []),
  );
  const undrivenPick = armCoverPassTransformer({
    keys: keys.map((caseKeys) =>
      caseKeys.filter((key) => !drivenArms.has(key)),
    ),
    candidates: undrivenIndexes,
  });
  // A branchless entry takes no arm at all, yet it must run once.
  const runsAtLeastOnce =
    drivenIndexes.length > 0 && drivenPick.length === 0
      ? [drivenIndexes[0] ?? 0]
      : [];
  const selected = new Set([
    ...drivenPick,
    ...undrivenPick,
    ...runsAtLeastOnce,
  ]);

  return cases.map((testCase, index) =>
    derivedTestCaseContract.parse({
      ...testCase,
      fewestRuns: selected.has(index),
    }),
  );
};

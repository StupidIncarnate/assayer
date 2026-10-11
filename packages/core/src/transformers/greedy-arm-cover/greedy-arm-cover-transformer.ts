/**
 * PURPOSE: Covers a list of arms greedily: it picks the candidate case that takes the most uncovered arms
 *   (the earliest on a tie), then repeats on what is left. It is the fallback `arm-cover-pass` uses when
 *   there are too many candidates to search exactly. The answer is deterministic.
 *
 * USAGE:
 * greedyArmCoverTransformer({ keys, candidates: [0, 1], uncovered: ['a|then', 'a|else'] });
 * // Returns the indexes of the chosen cases, in the order they were chosen
 */
import { isArmTakenGuard } from "../../guards/is-arm-taken/is-arm-taken-guard";

export const greedyArmCoverTransformer = ({
  keys,
  candidates,
  uncovered,
}: {
  keys: string[][];
  candidates: number[];
  uncovered: string[];
}): number[] => {
  if (uncovered.length === 0) {
    return [];
  }

  const best = candidates.reduce<{ index: number; gain: number } | undefined>(
    (leader, index) => {
      const gain = uncovered.filter((target) =>
        isArmTakenGuard({ caseKeys: keys[index], target }),
      ).length;

      return gain > (leader?.gain ?? 0) ? { index, gain } : leader;
    },
    undefined,
  );

  if (best === undefined) {
    return [];
  }

  return [
    best.index,
    ...greedyArmCoverTransformer({
      keys,
      candidates,
      uncovered: uncovered.filter(
        (target) => !isArmTakenGuard({ caseKeys: keys[best.index], target }),
      ),
    }),
  ];
};

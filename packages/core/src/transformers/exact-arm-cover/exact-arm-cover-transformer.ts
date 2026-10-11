/**
 * PURPOSE: Finds the smallest set of candidate cases that takes every uncovered arm, searching exactly.
 *   Each step covers the first uncovered arm with the earliest candidate that takes it and recurses on
 *   what is left, so of two covers of the same size the one using the earliest candidates wins. The search
 *   gives up on a branch once it holds `limit` cases; `arm-cover-pass` raises `limit` from zero until a
 *   cover is found.
 *
 * USAGE:
 * exactArmCoverTransformer({ keys, candidates: [0, 1], uncovered: ['a|then'], chosen: [], limit: 1 });
 * // Returns [0], or undefined when no cover of at most `limit` cases exists
 */
import { isArmTakenGuard } from "../../guards/is-arm-taken/is-arm-taken-guard";

export const exactArmCoverTransformer = ({
  keys,
  candidates,
  uncovered,
  chosen,
  limit,
}: {
  keys: string[][];
  candidates: number[];
  uncovered: string[];
  chosen: number[];
  limit: number;
}): number[] | undefined => {
  const [target] = uncovered;

  if (target === undefined) {
    return chosen;
  }

  if (chosen.length >= limit) {
    return undefined;
  }

  for (const index of candidates.filter((candidate) =>
    isArmTakenGuard({ caseKeys: keys[candidate], target }),
  )) {
    const found = exactArmCoverTransformer({
      keys,
      candidates,
      uncovered: uncovered.filter(
        (remaining) =>
          !isArmTakenGuard({ caseKeys: keys[index], target: remaining }),
      ),
      chosen: [...chosen, index],
      limit,
    });

    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};

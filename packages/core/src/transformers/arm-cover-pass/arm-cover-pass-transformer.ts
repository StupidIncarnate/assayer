/**
 * PURPOSE: Picks the smallest subset of candidate cases that takes every arm any of them takes. Cases that
 *   take exactly the same arms count once, and the earliest stands for them. Up to
 *   `armCoverStatics.exactCandidateLimit` distinct candidates the cover is the exact minimum; past it the
 *   cover is greedy. Both are deterministic.
 *
 * USAGE:
 * armCoverPassTransformer({ keys: [['a|then'], ['a|else']], candidates: [0, 1] });
 * // Returns [0, 1]
 */
import { armCoverStatics } from "../../statics/arm-cover/arm-cover-statics";
import { exactArmCoverTransformer } from "../exact-arm-cover/exact-arm-cover-transformer";
import { greedyArmCoverTransformer } from "../greedy-arm-cover/greedy-arm-cover-transformer";

export const armCoverPassTransformer = ({
  keys,
  candidates,
}: {
  keys: string[][];
  candidates: number[];
}): number[] => {
  const distinct = candidates.filter(
    (index, position) =>
      candidates.findIndex(
        (other) =>
          [...(keys[other] ?? [])].sort().join("\n") ===
          [...(keys[index] ?? [])].sort().join("\n"),
      ) === position,
  );
  const targets = [...new Set(distinct.flatMap((index) => keys[index] ?? []))];

  if (distinct.length > armCoverStatics.exactCandidateLimit) {
    return greedyArmCoverTransformer({
      keys,
      candidates: distinct,
      uncovered: targets,
    });
  }

  for (let limit = 0; limit <= distinct.length; limit += 1) {
    const found = exactArmCoverTransformer({
      keys,
      candidates: distinct,
      uncovered: targets,
      chosen: [],
      limit,
    });

    if (found !== undefined) {
      return found;
    }
  }

  return [];
};

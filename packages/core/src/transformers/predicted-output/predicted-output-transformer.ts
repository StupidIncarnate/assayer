/**
 * PURPOSE: Builds the predicted-output key of a derived case — what the salient (execution) subset
 *   groups on. For an entry whose branching decides which EXIT runs, the exit path IS the output: two
 *   buckets that reach the same exit path always return the same literal, so `reachesPath` alone
 *   separates outputs. The sole exception is a branchless predicate, whose two return values
 *   (`true`/`false`) leave by the SAME exit — there `predWant` splits them, so both outputs earn their
 *   own salient case.
 *
 *   Effects are NOT modeled: two buckets that reach the same exit but differ only in a side effect
 *   (a `console.log` on one module-scope arm, say) share a key and collapse to one salient
 *   representative. The FULL bucket set still carries both — only the execution-salient subset
 *   over-collapses them, which is the runtime economy the salient subset is allowed.
 *
 * USAGE:
 * predictedOutputTransformer({ reachesPath: [exitId] });
 * // Returns the joined exit path as the key
 * predictedOutputTransformer({ reachesPath: [exitId], predWant: true });
 * // Returns `${exitId}|pred:true`
 */
import type { CoverageId } from '@assayer/shared/contracts';

import { predictedOutputContract } from '../../contracts/predicted-output/predicted-output-contract';
import type { PredictedOutput } from '../../contracts/predicted-output/predicted-output-contract';

export const predictedOutputTransformer = ({
  reachesPath,
  predWant,
}: {
  reachesPath: CoverageId[];
  predWant?: boolean;
}): PredictedOutput => {
  const key = reachesPath.map(String).join('>');

  return predictedOutputContract.parse(predWant === undefined ? key : `${key}|pred:${String(predWant)}`);
};

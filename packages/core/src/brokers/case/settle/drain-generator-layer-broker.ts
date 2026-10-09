/**
 * PURPOSE: Iterates one generator to its end, one value at a time, so the generator's body runs every
 *   statement it would run for a caller that consumes it all. `caseSettleBroker` is its only caller.
 *
 *   It stops after `caseSettleStatics.limits.generatorSteps` values and closes the generator through
 *   `return`, so its `finally` blocks still run. It reports whether the generator finished on its own,
 *   because a generator stopped at the limit never reached its end, and the case must say so.
 *
 *   Each value is awaited, which makes one loop serve a sync generator and an async one alike.
 *
 * USAGE:
 * await drainGeneratorLayerBroker({ generator, step: 0 });
 * // Returns true once the generator is done, or false when it hit the step limit first
 */
import { caseSettleStatics } from '../../../statics/case-settle/case-settle-statics';

export const drainGeneratorLayerBroker = async ({
  generator,
  step,
}: {
  generator: Iterator<unknown> | AsyncIterator<unknown>;
  step: number;
}): Promise<boolean> => {
  if (step >= caseSettleStatics.limits.generatorSteps) {
    await generator.return?.(undefined);

    return false;
  }

  const next = await generator.next();

  return next.done === true ? true : drainGeneratorLayerBroker({ generator, step: step + 1 });
};

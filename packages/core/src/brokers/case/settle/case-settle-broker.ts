/**
 * PURPOSE: Lets the value an entry returned finish running, before the case interpreter reads which
 *   exit the entry reached. The interpreter calls this once per case, inside the environment the case
 *   arranged.
 *
 *   Calling an entry does not always run its body to the end:
 *   - An async function returns a promise at its first `await`. The exit after that `await` fires
 *     only when the promise settles, so the result is awaited. A module re-loaded in an ESM run is an
 *     import promise, and it is awaited for the same reason.
 *   - A generator function returns a generator and runs none of its body. The body runs only while
 *     something iterates it, so the generator is iterated to its end. An async generator is iterated
 *     the same way.
 *   Any other value is already final, and awaiting it changes nothing.
 *
 *   A rejected promise or a throw inside the generator propagates to the interpreter, which records
 *   the case as errored with the message.
 *
 * USAGE:
 * await caseSettleBroker({ result: entryResult });
 * // Returns true once the result has finished running, or false when a generator hit the step limit
 */
import { caseSettleStatics } from '../../../statics/case-settle/case-settle-statics';
import { drainGeneratorLayerBroker } from './drain-generator-layer-broker';

export const caseSettleBroker = async ({ result }: { result: unknown }): Promise<boolean> => {
  const settled: unknown = await result;
  const tag = Object.prototype.toString.call(settled);

  if (!caseSettleStatics.generatorTags.some((generatorTag) => generatorTag === tag)) {
    return true;
  }

  // The tag is the generator's own `Symbol.toStringTag`, so this value is a generator object.
  return drainGeneratorLayerBroker({ generator: settled as Iterator<unknown> | AsyncIterator<unknown>, step: 0 });
};

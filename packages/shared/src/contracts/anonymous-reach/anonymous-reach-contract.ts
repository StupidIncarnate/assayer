/**
 * PURPOSE: Contract for HOW an anonymous function is reached — the fact that gives a scope with no
 *   name something a reader can recognise it by. An anonymous arrow cannot be named, but it can
 *   always be POINTED AT: it is the callback in `items.map(…)`, the closure `makeClassifier` returns,
 *   or a body invoked where it stands.
 *
 *   This is the display twin of `EntryAccess`, and the two are not interchangeable. Access says how a
 *   RUNNER lays hands on an entry, and drives execution; reach says how a READER finds it in the
 *   source, and drives text. Folding them would put display concerns in the runner's vocabulary.
 *
 *   `argument` covers every inline function passed to a call. A `receiver.method(…)` shape carries
 *   both names (`items.map`); a bare call carries its `callee` (`register`); a computed or chained
 *   callee carries neither, and the label degrades to naming the position alone rather than guessing.
 *
 * USAGE:
 * anonymousReachContract.parse({ kind: 'argument', receiver: 'items', method: 'map' });
 * // Returns a validated AnonymousReach (discriminated on `kind`)
 */
import { z } from '#gateway/npm/zod';


export const anonymousReachContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('argument'),
    receiver: z.string().min(1).brand<'AnonymousReachReceiver'>().optional(),
    method: z.string().min(1).brand<'AnonymousReachMethod'>().optional(),
    callee: z.string().min(1).brand<'AnonymousReachCallee'>().optional(),
  }).brand<'AnonymousReach'>(),
  z.object({ kind: z.literal('return') }).brand<'AnonymousReach'>(),
  z.object({ kind: z.literal('invocation') }).brand<'AnonymousReach'>(),
]);

export type AnonymousReach = z.infer<typeof anonymousReachContract>;

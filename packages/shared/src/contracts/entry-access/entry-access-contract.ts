/**
 * PURPOSE: Contract for an entry's ACCESS — HOW a caller outside the module reaches it, which is a
 *   different question from whether it is reachable at all (`exported`). A derived case carries
 *   arrange values and a predicted exit, but neither says how to lay hands on the function: a named
 *   export is a property of the module, a default export lives under `default`, and a method needs
 *   an instance first. Without this the runner can only guess the named-export shape, and every
 *   other shape fails as though the ANALYZER were wrong.
 *
 *   `constructable` is the escalation point: a class whose constructor needs arguments cannot be
 *   driven without them, so it becomes a NAMED gap ("needs a harness") rather than a silent skip or
 *   a false failure.
 *
 *   `constructor` is its own kind rather than a method, because it is reached through `new` and NOT
 *   as a property: resolving it like a method yields the class itself, and applying that without
 *   `new` throws. It is a gap, not a failure — its logic is real and currently undriven.
 *
 *   `unreachable` is not an error — it is the honest answer for a module scope (its branches run at
 *   require time, so nothing can call it) and for a nested helper (driving it directly would be
 *   testing a private).
 *
 * USAGE:
 * entryAccessContract.parse({ kind: 'method', className: 'Classifier', constructable: true });
 * // Returns a validated EntryAccess (discriminated on `kind`)
 */
import { z } from 'zod';

import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const entryAccessContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('named') }),
  z.object({ kind: z.literal('default') }),
  z.object({ kind: z.literal('method'), className: symbolNameContract, constructable: z.boolean() }),
  z.object({ kind: z.literal('constructor'), className: symbolNameContract }),
  z.object({ kind: z.literal('unreachable') }),
]);

export type EntryAccess = z.infer<typeof entryAccessContract>;

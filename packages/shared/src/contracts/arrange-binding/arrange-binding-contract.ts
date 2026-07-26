/**
 * PURPOSE: Contract for ONE arrange binding — how a single input is set up for a derived case. It is a
 *   DISCRIMINATED union because an input is not always a parameter: a function takes its inputs
 *   positionally (`param`), a module scope takes none yet reads `process.env` (`env`), and an object or
 *   array parameter is one argument whose inner shape is built per property / per element
 *   (`object` / `array`). The two are set by different acts and carry different value domains, so a
 *   single shape holding optional fields would make "neither" and "both" representable; discriminating
 *   on `kind` makes the wrong shape fail to parse instead.
 *
 *   Every value is drawn from an input domain, never from executing the code (P4). Both composite arms
 *   carry the recursive `ArrangeValue`, so they nest the same way: an `array` value is an
 *   `ArrangeValue[]` list and a nested `number[][]` arranges as `[[7]]`, while an `object` value is an
 *   `ArrangeValue` map keyed by property name and a nested `{ db: { host: string } }` arranges as
 *   `{ db: { host: 'localhost' } }`.
 *
 *   An `array` binding carries `rest` only when it realizes a REST parameter — mirroring how
 *   `ParamDescriptor` itself carries the fact — because the interpreter applies a binding differently
 *   by it: an ordinary array param is ONE positional argument (the array itself), while a rest param's
 *   array SPREADS across the tail positional slots it stands for, exactly as `tally(11, ...[7])` does.
 *   Carried only when true, so a plain array binding serializes exactly as it always did.
 *
 *   The `harness` arm carries NO value, and that is the whole reason it is its own arm. What a harness
 *   supplies is exactly what the fill seam has no vocabulary for — a callback, an instance, a thing with
 *   identity — so there is nothing to serialize into a case. It carries the parameter and the KEY PATH
 *   into the declaration instead, and the run resolves the live value by loading the same harness file
 *   the compile read. A value slot here would have to hold a rendering of a function, which is a second
 *   encoding of something only the run has.
 *
 *   A `harness` binding carries `rest` for the same reason an `array` one does: a harness can answer a
 *   REST parameter (`...sinks: ((m: string) => void)[]`) as readily as an ordinary one, and the resolved
 *   value at run time is an array either way — one the interpreter must SPREAD across the tail
 *   positional slots the parameter stands for, never hand over as a single argument nested one level too
 *   deep. Carried only when true, so a plain harness binding serializes exactly as it always did.
 *
 *   It is its OWN contract so every transformer that BUILDS an arrange — `derive-cases`, `cause-arrange`,
 *   the funnel's param fill — names one binding directly instead of indexing into the case's array type.
 *
 * USAGE:
 * arrangeBindingContract.parse({ kind: 'param', param: 'name', value: '' });
 * arrangeBindingContract.parse({ kind: 'array', param: 'items', value: [7] });
 * arrangeBindingContract.parse({ kind: 'object', param: 'config', value: { db: { host: 'localhost' } } });
 * // Returns a validated ArrangeBinding (discriminated on `kind`)
 */
import { z } from 'zod';

import { arrangeValueContract } from '../arrange-value/arrange-value-contract';
import { envValueContract } from '../env-value/env-value-contract';
import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { harnessKeyPathContract } from '../harness-key-path/harness-key-path-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';

export const arrangeBindingContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('param'),
    param: symbolNameContract,
    value: representativeValueContract,
  }),
  z.object({
    kind: z.literal('env'),
    name: envVarNameContract,
    value: envValueContract,
  }),
  z.object({
    kind: z.literal('object'),
    param: symbolNameContract,
    value: z.record(symbolNameContract, arrangeValueContract),
  }),
  z.object({
    kind: z.literal('array'),
    param: symbolNameContract,
    value: z.array(arrangeValueContract),
    // Present only when this array realizes a REST parameter — see the PURPOSE doc above.
    rest: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('harness'),
    param: symbolNameContract,
    key: harnessKeyPathContract,
    // Present only when this key realizes a REST parameter — see the PURPOSE doc above.
    rest: z.boolean().optional(),
  }),
]);

export type ArrangeBinding = z.infer<typeof arrangeBindingContract>;

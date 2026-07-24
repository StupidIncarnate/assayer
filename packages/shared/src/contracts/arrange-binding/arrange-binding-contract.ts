/**
 * PURPOSE: Contract for ONE arrange binding — how a single input is set up for a derived case. It is a
 *   DISCRIMINATED union because an input is not always a parameter: a function takes its inputs
 *   positionally (`param`), a module scope takes none yet reads `process.env` (`env`), and an object or
 *   array parameter is one argument whose inner shape is built per property / per element
 *   (`object` / `array`). The two are set by different acts and carry different value domains, so a
 *   single shape holding optional fields would make "neither" and "both" representable; discriminating
 *   on `kind` makes the wrong shape fail to parse instead.
 *
 *   Every value is drawn from an input domain, never from executing the code (P4). An `object` value is
 *   a FLAT property map of scalars; an `array` value is the recursive `ArrangeValue[]` list, so a nested
 *   `number[][]` arranges as `[[7]]`.
 *
 *   It is its OWN contract so every transformer that BUILDS an arrange — `derive-cases`, `cause-arrange`,
 *   the funnel's param fill — names one binding directly instead of indexing into the case's array type.
 *
 * USAGE:
 * arrangeBindingContract.parse({ kind: 'param', param: 'name', value: '' });
 * arrangeBindingContract.parse({ kind: 'array', param: 'items', value: [7] });
 * // Returns a validated ArrangeBinding (discriminated on `kind`)
 */
import { z } from 'zod';

import { arrangeValueContract } from '../arrange-value/arrange-value-contract';
import { envValueContract } from '../env-value/env-value-contract';
import { envVarNameContract } from '../env-var-name/env-var-name-contract';
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
    value: z.record(symbolNameContract, representativeValueContract),
  }),
  z.object({
    kind: z.literal('array'),
    param: symbolNameContract,
    value: z.array(arrangeValueContract),
  }),
]);

export type ArrangeBinding = z.infer<typeof arrangeBindingContract>;

/**
 * PURPOSE: Contract for a declared type — one locally-declared interface/type-alias OBJECT shape a
 *   file names, paired with its FULL property list (each property's name and serializable type
 *   descriptor). This is the source later phases splice per-property value demands onto: the whole
 *   shape a file owns, independent of which properties any single consumer reads. Only types the
 *   hermetic walk can enumerate appear here — a same-file declaration — because an imported type
 *   resolves to `any` in the walk and is reconciled at the stitch, not here.
 *
 * USAGE:
 * declaredTypeContract.parse({ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] });
 * // Returns a validated DeclaredType (branded fields)
 */
import { z } from 'zod';

import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const declaredTypeContract = z.object({
  name: symbolNameContract,
  properties: z.array(z.object({ name: symbolNameContract, type: typeDescriptorContract })),
});

export type DeclaredType = z.infer<typeof declaredTypeContract>;

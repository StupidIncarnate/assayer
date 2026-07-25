/**
 * PURPOSE: Contract for one type DECLARATION a file makes — the declared NAME paired with the type
 *   descriptor it denotes. The name is what makes the channel resolvable: an `interface Config` carries
 *   its name inside its own object descriptor, but `type Id = string` and `type Level = 'low' | 'high'`
 *   denote a descriptor with no name slot at all, so the declaration's name has nowhere else to live
 *   and every name-keyed lookup over the file's declared surface would miss them.
 *
 *   The name is the declaration identifier's, read off the declaration node — a spelling-invariant name
 *   (§5.1), never span text.
 *
 *   `typeParams` names the declaration's type PARAMETERS in order, for a generic one. They are the slots
 *   a reference's type ARGUMENTS fill: `type Box<T> = { value: T }` denotes nothing constructible on its
 *   own, and only `Box<string>` says what `T` is. Carried only when the declaration has any, so a plain
 *   shape serializes exactly as before.
 *
 * USAGE:
 * declaredShapeContract.parse({ name: 'Id', type: { kind: 'string' } });
 * // Returns a validated DeclaredShape (branded fields)
 */
import { z } from 'zod';

import { symbolNameContract, typeDescriptorContract } from '@assayer/shared/contracts';

export const declaredShapeContract = z.object({
  name: symbolNameContract,
  type: typeDescriptorContract,
  typeParams: z.array(symbolNameContract).optional(),
});

export type DeclaredShape = z.infer<typeof declaredShapeContract>;

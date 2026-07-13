/**
 * PURPOSE: Contract for a parameter descriptor — a single entry parameter's name paired with its
 *   serializable type descriptor, so the analyzer knows what value domain to arrange for it.
 *
 * USAGE:
 * paramDescriptorContract.parse({ name: 'name', type: { kind: 'string' } });
 * // Returns a validated ParamDescriptor (branded fields)
 */
import { z } from 'zod';

import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const paramDescriptorContract = z.object({
  name: symbolNameContract,
  type: typeDescriptorContract,
});

export type ParamDescriptor = z.infer<typeof paramDescriptorContract>;

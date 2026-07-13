/**
 * PURPOSE: Contract for an entry signature — an exported package-function-entry function's name,
 *   its parameters with type descriptors, its return type, and its declaration line: the callable
 *   surface a derived test case drives, plus where its params are rendered in the enrichment panel.
 *
 * USAGE:
 * entrySignatureContract.parse({
 *   name: 'formatGreeting', params: [{ name: 'name', type: { kind: 'string' } }], returnType: { kind: 'string' }, line: 1,
 * });
 * // Returns a validated EntrySignature (branded fields)
 */
import { z } from 'zod';

import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { paramDescriptorContract } from '../param-descriptor/param-descriptor-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const entrySignatureContract = z.object({
  name: symbolNameContract,
  params: z.array(paramDescriptorContract),
  returnType: typeDescriptorContract,
  line: lineNumberContract,
});

export type EntrySignature = z.infer<typeof entrySignatureContract>;

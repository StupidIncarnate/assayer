/**
 * PURPOSE: Contract for an entry signature — an analyzed entry's name, the ordered scope path that
 *   owns it, its parameters with type descriptors, its return type, and its declaration line: the
 *   callable surface a derived test case drives, plus where its params are rendered in the
 *   enrichment panel. `scopePath` is what lets two entries share a `name` without colliding — a
 *   class method (`['Classifier', 'classify']`) and a nested function (`['outer', 'inner']`) are
 *   distinguished by their path, and that same path prefixes every coverage ID they own.
 *
 *   `access` is what makes the entry ADDRESSABLE rather than merely described: the path names it,
 *   but only the access says how a caller lays hands on it (module property, `default`, or an
 *   instance method). A runner without it can only assume the named-export shape.
 *
 * USAGE:
 * entrySignatureContract.parse({
 *   name: 'classify', scopePath: ['Classifier', 'classify'],
 *   params: [{ name: 'value', type: { kind: 'number' } }], returnType: { kind: 'string' }, line: 2,
 *   access: { kind: 'method', className: 'Classifier', constructable: true },
 * });
 * // Returns a validated EntrySignature (branded fields)
 */
import { z } from 'zod';

import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { entryAccessContract } from '../entry-access/entry-access-contract';
import { paramDescriptorContract } from '../param-descriptor/param-descriptor-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const entrySignatureContract = z.object({
  name: symbolNameContract,
  scopePath: z.array(symbolNameContract),
  params: z.array(paramDescriptorContract),
  returnType: typeDescriptorContract,
  line: lineNumberContract,
  access: entryAccessContract,
});

export type EntrySignature = z.infer<typeof entrySignatureContract>;

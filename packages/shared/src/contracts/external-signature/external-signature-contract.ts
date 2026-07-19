/**
 * PURPOSE: Contract for an external signature — the declared parameter and return types of a callable
 *   an importing file reaches across the module boundary (an npm package or node builtin export),
 *   read from its `.d.ts` and projected into the SAME serializable shape a local scope record carries
 *   (`params` with type descriptors + a `returnType`). It is the typed black box: the boundary types
 *   are known at the edge without ever opening the dependency's implementation, so a derived case can
 *   arrange inputs for a package call exactly as it does for a local one.
 *
 * USAGE:
 * externalSignatureContract.parse({
 *   params: [{ name: 'name', type: { kind: 'string' } }],
 *   returnType: { kind: 'string' },
 * });
 * // Returns a validated ExternalSignature (branded fields)
 */
import { z } from 'zod';

import { paramDescriptorContract } from '../param-descriptor/param-descriptor-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const externalSignatureContract = z.object({
  params: z.array(paramDescriptorContract),
  returnType: typeDescriptorContract,
});

export type ExternalSignature = z.infer<typeof externalSignatureContract>;

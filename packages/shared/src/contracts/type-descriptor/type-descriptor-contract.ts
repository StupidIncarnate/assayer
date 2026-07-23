/**
 * PURPOSE: Contract for a serializable type descriptor — a closed, JSON-safe projection of a
 *   TypeScript type (string, number, boolean, a literal value, a union of members, an ARRAY of one
 *   element type, an OBJECT enumerating its named properties, or an opaque unknown carrying its type
 *   text) extracted by the ts-morph adapter so downstream transformers can reason about value
 *   domains without touching ts-morph. An `object` descriptor keeps `typeName` only when the type has
 *   a name; a KEYLESS object (an anonymous/inline shape) is the "not-stubbed" signal.
 *
 * USAGE:
 * typeDescriptorContract.parse({ kind: 'string' });
 * typeDescriptorContract.parse({ kind: 'array', element: { kind: 'number' } });
 * typeDescriptorContract.parse({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] });
 * // Returns a validated TypeDescriptor (recursive discriminated union)
 */
import { z } from 'zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';
import type { RepresentativeValue } from '../representative-value/representative-value-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import type { SymbolName } from '../symbol-name/symbol-name-contract';
import { typeTextContract } from '../type-text/type-text-contract';
import type { TypeText } from '../type-text/type-text-contract';

// A known element COUNT, carried for a future fixed-length rung — optional and unused for now, so a
// descriptor omits it rather than inventing a length it cannot know.
const arrayCardinalityContract = z.number().int().nonnegative().brand<'ArrayCardinality'>();

export type TypeDescriptor =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'literal'; value: RepresentativeValue }
  | { kind: 'union'; members: TypeDescriptor[] }
  | { kind: 'array'; element: TypeDescriptor; cardinality?: z.infer<typeof arrayCardinalityContract> | undefined }
  | { kind: 'object'; typeName?: SymbolName | undefined; properties: { name: SymbolName; type: TypeDescriptor }[] }
  | { kind: 'unknown'; text: TypeText };

export const typeDescriptorContract: z.ZodType<TypeDescriptor, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('string') }),
    z.object({ kind: z.literal('number') }),
    z.object({ kind: z.literal('boolean') }),
    z.object({ kind: z.literal('literal'), value: representativeValueContract }),
    z.object({ kind: z.literal('union'), members: z.array(typeDescriptorContract) }),
    z.object({ kind: z.literal('array'), element: typeDescriptorContract, cardinality: arrayCardinalityContract.optional() }),
    z.object({
      kind: z.literal('object'),
      typeName: symbolNameContract.optional(),
      properties: z.array(z.object({ name: symbolNameContract, type: typeDescriptorContract })),
    }),
    z.object({ kind: z.literal('unknown'), text: typeTextContract }),
  ]),
);

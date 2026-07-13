/**
 * PURPOSE: Contract for a serializable type descriptor — a closed, JSON-safe projection of a
 *   TypeScript type (string, number, boolean, a literal value, a union of members, or an opaque
 *   unknown carrying its type text) extracted by the ts-morph adapter so downstream transformers
 *   can reason about value domains without touching ts-morph.
 *
 * USAGE:
 * typeDescriptorContract.parse({ kind: 'string' });
 * typeDescriptorContract.parse({ kind: 'union', members: [{ kind: 'literal', value: 'a' }] });
 * // Returns a validated TypeDescriptor (recursive discriminated union)
 */
import { z } from 'zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';
import type { RepresentativeValue } from '../representative-value/representative-value-contract';
import { typeTextContract } from '../type-text/type-text-contract';
import type { TypeText } from '../type-text/type-text-contract';

export type TypeDescriptor =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'literal'; value: RepresentativeValue }
  | { kind: 'union'; members: TypeDescriptor[] }
  | { kind: 'unknown'; text: TypeText };

export const typeDescriptorContract: z.ZodType<TypeDescriptor, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('string') }),
    z.object({ kind: z.literal('number') }),
    z.object({ kind: z.literal('boolean') }),
    z.object({ kind: z.literal('literal'), value: representativeValueContract }),
    z.object({ kind: z.literal('union'), members: z.array(typeDescriptorContract) }),
    z.object({ kind: z.literal('unknown'), text: typeTextContract }),
  ]),
);

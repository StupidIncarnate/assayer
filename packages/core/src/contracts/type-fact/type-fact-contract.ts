/**
 * PURPOSE: Contract for a type fact — the ts-morph adapter's raw, serializable readout of one
 *   TypeScript type before it is interpreted into a TypeDescriptor. It records only what the type
 *   checker directly reports (primitive flavor, a literal value, or a union of member facts), so the
 *   single type-descriptor transformer can own ALL interpretation (union collapse, unknown fallback)
 *   without ts-morph. A union fact carries its whole-type display text for the non-literal fallback.
 *
 * USAGE:
 * typeFactContract.parse({ flavor: 'string' });
 * typeFactContract.parse({ flavor: 'union', members: [{ flavor: 'literal', value: 'a' }], text: '"a"' });
 * // Returns a validated TypeFact (recursive discriminated union)
 */
import { z } from 'zod';

import { representativeValueContract, typeTextContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeText } from '@assayer/shared/contracts';

export type TypeFact =
  | { flavor: 'string' }
  | { flavor: 'number' }
  | { flavor: 'boolean' }
  | { flavor: 'literal'; value: RepresentativeValue }
  | { flavor: 'union'; members: TypeFact[]; text: TypeText }
  | { flavor: 'other'; text: TypeText };

export const typeFactContract: z.ZodType<TypeFact, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.discriminatedUnion('flavor', [
    z.object({ flavor: z.literal('string') }),
    z.object({ flavor: z.literal('number') }),
    z.object({ flavor: z.literal('boolean') }),
    z.object({ flavor: z.literal('literal'), value: representativeValueContract }),
    z.object({ flavor: z.literal('union'), members: z.array(typeFactContract), text: typeTextContract }),
    z.object({ flavor: z.literal('other'), text: typeTextContract }),
  ]),
);

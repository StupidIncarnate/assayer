/**
 * PURPOSE: Contract for a type fact — the ts-morph adapter's raw, serializable readout of one
 *   TypeScript type before it is interpreted into a TypeDescriptor. It records what the type checker
 *   directly reports (primitive flavor, a literal value, a union of member facts, an ARRAY of one
 *   element fact, or an OBJECT enumerating its named properties), so the single type-descriptor
 *   transformer can own ALL interpretation (union collapse, unknown fallback) without ts-morph. A
 *   union fact carries its whole-type display text for the non-literal fallback; an object fact keeps
 *   its `typeName` only when the type is named (an anonymous shape stays keyless).
 *
 * USAGE:
 * typeFactContract.parse({ flavor: 'string' });
 * typeFactContract.parse({ flavor: 'union', members: [{ flavor: 'literal', value: 'a' }], text: '"a"' });
 * typeFactContract.parse({ flavor: 'array', element: { flavor: 'number' } });
 * typeFactContract.parse({ flavor: 'object', typeName: 'Config', properties: [{ name: 'mode', fact: { flavor: 'string' } }] });
 * // Returns a validated TypeFact (recursive discriminated union)
 */
import { z } from 'zod';

import { representativeValueContract, symbolNameContract, typeTextContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, SymbolName, TypeText } from '@assayer/shared/contracts';

export type TypeFact =
  | { flavor: 'string' }
  | { flavor: 'number' }
  | { flavor: 'boolean' }
  | { flavor: 'literal'; value: RepresentativeValue }
  | { flavor: 'union'; members: TypeFact[]; text: TypeText }
  | { flavor: 'array'; element: TypeFact }
  | { flavor: 'object'; typeName?: SymbolName | undefined; properties: { name: SymbolName; fact: TypeFact }[] }
  | { flavor: 'other'; text: TypeText };

export const typeFactContract: z.ZodType<TypeFact, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.discriminatedUnion('flavor', [
    z.object({ flavor: z.literal('string') }),
    z.object({ flavor: z.literal('number') }),
    z.object({ flavor: z.literal('boolean') }),
    z.object({ flavor: z.literal('literal'), value: representativeValueContract }),
    z.object({ flavor: z.literal('union'), members: z.array(typeFactContract), text: typeTextContract }),
    z.object({ flavor: z.literal('array'), element: typeFactContract }),
    z.object({
      flavor: z.literal('object'),
      typeName: symbolNameContract.optional(),
      properties: z.array(z.object({ name: symbolNameContract, fact: typeFactContract })),
    }),
    z.object({ flavor: z.literal('other'), text: typeTextContract }),
  ]),
);

/**
 * PURPOSE: Contract for a type fact — the ts-morph adapter's raw, serializable readout of one
 *   TypeScript type before it is interpreted into a TypeDescriptor. It records what the type checker
 *   directly reports (primitive flavor, a literal value, a union of member facts, an ARRAY of one
 *   element fact, an OBJECT enumerating its named properties, or a CALLABLE — a type carrying call
 *   signatures — with the checker's rendering of it, which is the type's NAME when it has one and its
 *   rendered signature when it is anonymous), so the single type-descriptor transformer can own ALL
 *   interpretation (union collapse, unknown fallback) without ts-morph. A union fact carries its
 *   whole-type display text for the opaque-member fallback; an object fact keeps its `typeName` only
 *   when the type is named (an anonymous shape stays keyless) and carries `truncated` when its empty
 *   property list is where the reader STOPPED on a self-referential type rather than what the type
 *   declares. A boolean LITERAL is a `literal` fact carrying `true`/`false`, so a `string | boolean`
 *   union has three representable members. An `other` fact carries `typeRef` when the opaque type was
 *   declared as a plain type reference, which is what a consume-time overlay resolves it by.
 *
 *   A TUPLE fact (`elements`) carries one fact per fixed position, never one shared element the way an
 *   array does — `readonly [string, number]` needs a string at position 0 and a number at position 1.
 *   A TEMPLATE fact mirrors the checker's own `texts`/`types` split for a template literal type
 *   (`` `id-${string}` ``): the literal segments in source order, and one fact per substitution
 *   between them.
 *
 * USAGE:
 * typeFactContract.parse({ flavor: 'string' });
 * typeFactContract.parse({ flavor: 'union', members: [{ flavor: 'literal', value: 'a' }], text: '"a"' });
 * typeFactContract.parse({ flavor: 'array', element: { flavor: 'number' } });
 * typeFactContract.parse({ flavor: 'tuple', elements: [{ flavor: 'string' }, { flavor: 'number' }] });
 * typeFactContract.parse({ flavor: 'template', texts: ['id-', ''], types: [{ flavor: 'string' }] });
 * typeFactContract.parse({ flavor: 'object', typeName: 'Config', properties: [{ name: 'mode', fact: { flavor: 'string' } }] });
 * typeFactContract.parse({ flavor: 'callable', text: '(message: string) => string' });
 * // Returns a validated TypeFact (recursive discriminated union)
 */
import { z } from 'zod';

import { representativeValueContract, symbolNameContract, templateTextContract, typeTextContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, SymbolName, TemplateText, TypeText } from '@assayer/shared/contracts';

export type TypeFact =
  | { flavor: 'string' }
  | { flavor: 'number' }
  | { flavor: 'boolean' }
  | { flavor: 'literal'; value: RepresentativeValue }
  | { flavor: 'union'; members: TypeFact[]; text: TypeText }
  | { flavor: 'array'; element: TypeFact }
  // Fixed-length and HETEROGENEOUS, unlike `array` — see the PURPOSE doc.
  | { flavor: 'tuple'; elements: TypeFact[] }
  // The checker's own `texts`/`types` split for a template literal type — see the PURPOSE doc.
  | { flavor: 'template'; texts: TemplateText[]; types: TypeFact[] }
  /**
   * `truncated` is true when the reader re-entered a type already on its own path
   * (`interface Tree { next: Tree }`) and stopped, so the empty property list is where the read ended
   * rather than the type's declaration.
   */
  | {
      flavor: 'object';
      typeName?: SymbolName | undefined;
      truncated?: boolean | undefined;
      properties: { name: SymbolName; fact: TypeFact; optional?: boolean | undefined }[];
    }
  | { flavor: 'callable'; text: TypeText }
  /**
   * `typeRef` is the type-reference NAME the declaration spelled, present only when the opaque type was
   * written as a plain reference (`config: Config`). It is the FOREIGN KEY a consume-time overlay
   * resolves the real declaration by; `text` stays the display rendering. `typeArgs` carries the
   * reference's type ARGUMENTS in order (`Box<string>`), which are what the declaration's type
   * parameters stand for.
   */
  | { flavor: 'other'; text: TypeText; typeRef?: SymbolName | undefined; typeArgs?: TypeFact[] | undefined };

export const typeFactContract: z.ZodType<TypeFact> = z.lazy(() =>
  z.discriminatedUnion('flavor', [
    z.object({ flavor: z.literal('string') }),
    z.object({ flavor: z.literal('number') }),
    z.object({ flavor: z.literal('boolean') }),
    z.object({ flavor: z.literal('literal'), value: representativeValueContract }),
    z.object({ flavor: z.literal('union'), members: z.array(typeFactContract), text: typeTextContract }),
    z.object({ flavor: z.literal('array'), element: typeFactContract }),
    z.object({ flavor: z.literal('tuple'), elements: z.array(typeFactContract) }),
    z.object({ flavor: z.literal('template'), texts: z.array(templateTextContract), types: z.array(typeFactContract) }),
    z.object({
      flavor: z.literal('object'),
      typeName: symbolNameContract.optional(),
      truncated: z.boolean().optional(),
      properties: z.array(
        z.object({ name: symbolNameContract, fact: typeFactContract, optional: z.boolean().optional() }),
      ),
    }),
    z.object({ flavor: z.literal('callable'), text: typeTextContract }),
    z.object({
      flavor: z.literal('other'),
      text: typeTextContract,
      typeRef: symbolNameContract.optional(),
      typeArgs: z.array(typeFactContract).optional(),
    }),
  ]),
);

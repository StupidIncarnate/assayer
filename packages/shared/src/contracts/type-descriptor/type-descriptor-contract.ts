/**
 * PURPOSE: Contract for a serializable type descriptor — a closed, JSON-safe projection of a
 *   TypeScript type (string, number, boolean, a literal value, a union of members, an ARRAY of one
 *   element type, a TUPLE of one descriptor per fixed position, a TEMPLATE LITERAL of alternating
 *   literal text segments and substitution types, an OBJECT enumerating its named properties, a
 *   CALLABLE carrying the checker's rendering of its type — the type's NAME when it has one, its
 *   rendered signature when it is anonymous — or an opaque unknown carrying its type text) extracted
 *   by the ts-morph adapter so downstream transformers can reason about value domains without
 *   touching ts-morph. An `object` descriptor keeps `typeName` only when the type has a name; a
 *   KEYLESS object (an anonymous/inline shape) is the "not-stubbed" signal. A `callable` is its own
 *   kind rather than a property-less object, so a callback parameter is distinguishable from an empty
 *   interface. An object carries `truncated` when its empty property list is the READER stopping, so
 *   a self-referential shape stays distinguishable from a genuinely property-less one. An `unknown`
 *   carries `typeRef` when the opaque type was declared as a plain type reference, which is the name
 *   a consume-time overlay resolves it by.
 *
 *   A `tuple` is fixed-length and HETEROGENEOUS, unlike an `array`: `readonly [string, number]` carries
 *   one descriptor per position rather than one shared element type, so its filled value pairs a string
 *   at index 0 with a number at index 1 instead of repeating one type twice.
 *
 *   A `template` mirrors the checker's own `texts`/`types` split for a template literal type
 *   (`` `id-${string}` ``): `texts` is the literal segments in source order, `types` is one descriptor
 *   per substitution between them, and `texts.length` is always `types.length + 1` — the segment before
 *   the first substitution and after the last are both present even when empty.
 *
 * USAGE:
 * typeDescriptorContract.parse({ kind: 'string' });
 * typeDescriptorContract.parse({ kind: 'array', element: { kind: 'number' } });
 * typeDescriptorContract.parse({ kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] });
 * typeDescriptorContract.parse({ kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] });
 * typeDescriptorContract.parse({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] });
 * typeDescriptorContract.parse({ kind: 'callable', text: '(message: string) => string' });
 * // Returns a validated TypeDescriptor (recursive discriminated union)
 */
import { z } from '#gateway/npm/zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';
import type { RepresentativeValue } from '../representative-value/representative-value-contract';
import { templateTextContract } from '../template-text/template-text-contract';
import type { TemplateText } from '../template-text/template-text-contract';

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
  // Fixed-length and HETEROGENEOUS: one descriptor per position, never one shared element type. This is
  // the whole difference from `array` — `readonly [string, number]` fills index 0 from a string and
  // index 1 from a number, which one shared `element` type could not express.
  | { kind: 'tuple'; elements: TypeDescriptor[] }
  // The checker's own `texts`/`types` split for a template literal type: `texts` is the literal
  // segments in source order, `types` is one descriptor per substitution between them, and
  // `texts.length` is always `types.length + 1`.
  | { kind: 'template'; texts: TemplateText[]; types: TypeDescriptor[] }
  /**
   * `truncated` is true when the reader STOPPED enumerating because the type re-entered its own path
   * (`interface Tree { label: string; next: Tree }` — the inner `Tree`), so the empty property list is
   * where the read ended, not what the type declares. No value of the declared shape can be built from
   * one: `{}` satisfies `interface Empty {}` and does not satisfy `Tree`.
   *
   * A property carries `optional` when the shape declares it with a question mark. It is a fact about
   * the PROPERTY, not its type — the checker widens `child?: TreeNode` to the same `TreeNode` a required
   * property declares — and it is what says nobody OWES the property a value, exactly as `optional` on a
   * parameter descriptor does. Carried only when true, so a plain shape serializes as it always did.
   */
  | {
      kind: 'object';
      typeName?: string | undefined;
      truncated?: boolean | undefined;
      properties: { name: string; type: TypeDescriptor; optional?: boolean | undefined }[];
    }
  | { kind: 'callable'; text: string }
  /**
   * `typeRef` is the type-reference NAME the declaration spelled (`Config` for `config: Config`), kept
   * only when the opaque type was written as a plain reference. It is the identifier's resolved
   * spelling, never span text, and it is a FOREIGN KEY rather than display: the hermetic walk types an
   * imported type as `any` (§5.10), and this is what a consume-time overlay looks the real declaration
   * up by. `text` stays the display rendering and answers nothing.
   *
   * `typeArgs` carries the reference's type ARGUMENTS in order, so `Box<string>` says what the
   * declaration's `T` stands for. A generic declaration denotes nothing constructible without them.
   */
  | { kind: 'unknown'; text: string; typeRef?: string | undefined; typeArgs?: TypeDescriptor[] | undefined };

export const typeDescriptorContract: z.ZodType<TypeDescriptor> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('string') }),
    z.object({ kind: z.literal('number') }),
    z.object({ kind: z.literal('boolean') }),
    z.object({ kind: z.literal('literal'), value: representativeValueContract }),
    z.object({ kind: z.literal('union'), members: z.array(typeDescriptorContract) }),
    z.object({ kind: z.literal('array'), element: typeDescriptorContract, cardinality: arrayCardinalityContract.optional() }),
    z.object({ kind: z.literal('tuple'), elements: z.array(typeDescriptorContract) }),
    z.object({ kind: z.literal('template'), texts: z.array(templateTextContract), types: z.array(typeDescriptorContract) }),
    z.object({
      kind: z.literal('object'),
      typeName: z.string().min(1).brand<'TypeDescriptorTypeName'>().optional(),
      truncated: z.boolean().optional(),
      properties: z.array(
        z.object({ name: z.string().min(1).brand<'TypeDescriptorPropertiesName'>(), type: typeDescriptorContract, optional: z.boolean().optional() }),
      ),
    }),
    z.object({ kind: z.literal('callable'), text: z.string().min(1).brand<'TypeDescriptorText'>() }),
    z.object({
      kind: z.literal('unknown'),
      text: z.string().min(1).brand<'TypeDescriptorText'>(),
      typeRef: z.string().min(1).brand<'TypeDescriptorTypeRef'>().optional(),
      typeArgs: z.array(typeDescriptorContract).optional(),
    }),
  ]),
);

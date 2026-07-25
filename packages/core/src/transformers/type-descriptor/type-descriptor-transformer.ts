/**
 * PURPOSE: Interprets a raw type fact (the ts-morph adapter's serializable type readout) into a
 *   serializable TypeDescriptor — the SINGLE place any type is turned into the analysis model, so no
 *   two bits of code encode type semantics. Primitives map straight across; a literal becomes a
 *   `literal` descriptor; an ARRAY maps to an `array` descriptor over its element; an OBJECT to an
 *   `object` descriptor carrying its name (when named), its `truncated` mark and property list; a
 *   CALLABLE to a `callable` descriptor carrying the checker's rendering of the type — its NAME when it
 *   has one, its rendered signature when it is anonymous. Recurses over union members, array elements
 *   and object properties, so nested/enumerated shapes are handled by the same one unit.
 *
 *   A union stays a `union` descriptor when ANY member is REPRESENTABLE — every member read through
 *   this same transformer, so a literal, a primitive, an array and an object all count — and degrades
 *   to `unknown` (carrying the union's display text) only when NO member is. Keeping `string | number`
 *   as its two members PRESERVES what the checker reported; it is the opposite of the operand WIDENING
 *   §5.9 forbids, which would throw the members away by collapsing them into one base type. Keeping
 *   `Plain | string` as ITS two members is what lets the fill seam build the half it can, which is the
 *   rule `is-type-fillable` states for a union.
 *
 * USAGE:
 * typeDescriptorTransformer({ fact: { flavor: 'string' } });
 * // Returns { kind: 'string' } (validated TypeDescriptor)
 */
import { typeDescriptorContract } from '@assayer/shared/contracts';
import type { TypeDescriptor } from '@assayer/shared/contracts';

import type { TypeFact } from '../../contracts/type-fact/type-fact-contract';

export const typeDescriptorTransformer = ({ fact }: { fact: TypeFact }): TypeDescriptor => {
  switch (fact.flavor) {
    case 'string':
      return typeDescriptorContract.parse({ kind: 'string' });
    case 'number':
      return typeDescriptorContract.parse({ kind: 'number' });
    case 'boolean':
      return typeDescriptorContract.parse({ kind: 'boolean' });
    case 'literal':
      return typeDescriptorContract.parse({ kind: 'literal', value: fact.value });
    case 'union': {
      // SOME member representable is enough to keep the union — a value of one member IS a value of the
      // union, so `Plain | string` carries both and the fill seam builds whichever it can. Degrading on
      // the first opaque member would refuse the whole type for the half nothing can build, which is
      // exactly what `is-type-fillable`'s union rule says not to do. Only a union NO member can be
      // represented in the descriptor language degrades, carrying the union's display text.
      const members = fact.members.map((member) => typeDescriptorTransformer({ fact: member }));

      return members.some((member) => member.kind !== 'unknown')
        ? typeDescriptorContract.parse({ kind: 'union', members })
        : typeDescriptorContract.parse({ kind: 'unknown', text: fact.text });
    }
    case 'array':
      return typeDescriptorContract.parse({ kind: 'array', element: typeDescriptorTransformer({ fact: fact.element }) });
    case 'object':
      return typeDescriptorContract.parse({
        kind: 'object',
        ...(fact.typeName === undefined ? {} : { typeName: fact.typeName }),
        // Carried, never re-derived: the READER is what knows its own property list was cut short by a
        // self-reference, and no later stage can tell that shape from a genuinely property-less one.
        ...(fact.truncated === true ? { truncated: true } : {}),
        properties: fact.properties.map((property) => ({
          name: property.name,
          type: typeDescriptorTransformer({ fact: property.fact }),
          // Carried through, never re-derived: optionality is the DECLARATION's, and the checker widens
          // it away before any later stage could ask.
          ...(property.optional === true ? { optional: true } : {}),
        })),
      });
    case 'callable':
      return typeDescriptorContract.parse({ kind: 'callable', text: fact.text });
    case 'other':
      return typeDescriptorContract.parse({
        kind: 'unknown',
        text: fact.text,
        // Carried, never re-derived from the text: the READER is what saw the declaration, and `Config[]`
        // renders as text that names no single reference.
        ...(fact.typeRef === undefined ? {} : { typeRef: fact.typeRef }),
        ...(fact.typeArgs === undefined
          ? {}
          : { typeArgs: fact.typeArgs.map((argument) => typeDescriptorTransformer({ fact: argument })) }),
      });
    default:
      return typeDescriptorContract.parse({ kind: 'unknown', text: 'unknown' });
  }
};

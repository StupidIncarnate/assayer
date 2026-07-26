/**
 * PURPOSE: Renders a serializable type descriptor as its display text for the enrichment panel —
 *   'string'/'number'/'boolean' for primitives, the JSON form of a literal, a `|`-joined list for
 *   a union, `element[]` for an array, `[a, b]` for a tuple's own per-position renderings, a
 *   backtick-quoted template for a template literal type, an object's NAME (or a braced property list
 *   when anonymous), a callable's own carried rendering (its type NAME when it has one, its rendered
 *   signature when anonymous), and the carried text for an opaque unknown type.
 *
 * USAGE:
 * typeTextTransformer({ type: { kind: 'string' } });
 * // Returns 'string' (branded TypeText)
 */
import { typeTextContract } from '@assayer/shared/contracts';
import type { TypeText, TypeDescriptor } from '@assayer/shared/contracts';

export const typeTextTransformer = ({ type }: { type: TypeDescriptor }): TypeText => {
  switch (type.kind) {
    case 'string':
      return typeTextContract.parse('string');
    case 'number':
      return typeTextContract.parse('number');
    case 'boolean':
      return typeTextContract.parse('boolean');
    case 'literal':
      return typeTextContract.parse(JSON.stringify(type.value));
    case 'union':
      return typeTextContract.parse(type.members.map((member) => typeTextTransformer({ type: member })).join(' | '));
    case 'array':
      return typeTextContract.parse(`${String(typeTextTransformer({ type: type.element }))}[]`);
    case 'tuple':
      return typeTextContract.parse(`[${type.elements.map((element) => String(typeTextTransformer({ type: element }))).join(', ')}]`);
    case 'template': {
      const substitutions = type.types.map((substitution) => String(typeTextTransformer({ type: substitution })));
      const body = type.texts.reduce((rendered, text, index) => {
        const substitution = substitutions[index];

        return substitution === undefined ? `${rendered}${String(text)}` : `${rendered}${String(text)}\${${substitution}}`;
      }, '');

      return typeTextContract.parse(`\`${body}\``);
    }
    case 'object':
      return typeTextContract.parse(
        type.typeName === undefined
          ? `{ ${type.properties.map((property) => `${String(property.name)}: ${String(typeTextTransformer({ type: property.type }))}`).join('; ')} }`
          : String(type.typeName),
      );
    case 'callable':
      return typeTextContract.parse(type.text);
    case 'unknown':
      return typeTextContract.parse(type.text);
    default:
      return typeTextContract.parse('string');
  }
};

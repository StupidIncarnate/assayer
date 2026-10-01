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
import type { TypeDescriptor } from '@assayer/shared/contracts';

export const typeTextTransformer = ({ type }: { type: TypeDescriptor }): string => {
  switch (type.kind) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'literal':
      return JSON.stringify(type.value);
    case 'union':
      return type.members.map((member) => typeTextTransformer({ type: member })).join(' | ');
    case 'array':
      return `${typeTextTransformer({ type: type.element })}[]`;
    case 'tuple':
      return `[${type.elements.map((element) => typeTextTransformer({ type: element })).join(', ')}]`;
    case 'template': {
      const substitutions = type.types.map((substitution) => typeTextTransformer({ type: substitution }));
      const body = type.texts.reduce((rendered, text, index) => {
        const substitution = substitutions[index];

        return substitution === undefined ? `${rendered}${text}` : `${rendered}${text}\${${substitution}}`;
      }, '');

      return `\`${body}\``;
    }
    case 'object':
      return (type.typeName === undefined
          ? `{ ${type.properties.map((property) => `${property.name}: ${typeTextTransformer({ type: property.type })}`).join('; ')} }`
          : type.typeName);
    case 'callable':
      return type.text;
    case 'unknown':
      return type.text;
    default:
      return 'string';
  }
};

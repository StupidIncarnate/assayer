/**
 * PURPOSE: Renders a serializable TypeDescriptor as compact display text for the detail panel — the
 *   type as a reader sees it in a resolved import's external signature (`string`, `number`, a literal
 *   value, a `a | b` union, `element[]` for an array, `[a, b]` for a tuple's own per-position
 *   renderings, a backtick-quoted template for a template literal type, an object's NAME or braced
 *   property list, a callable's carried rendering (its type NAME when it has one, its rendered
 *   signature when anonymous), or an opaque type's own text). Recurses over union members, array
 *   elements, tuple positions, template substitutions and object properties so a nested or enumerated
 *   shape renders through the same one unit. DISPLAY only — nothing here feeds analysis.
 *
 * USAGE:
 * typeDescriptorTextTransformer({ type: { kind: 'string' } });
 * // Returns 'string' (branded TypeText)
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

export const typeDescriptorTextTransformer = ({ type }: { type: TypeDescriptor }): string => {
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
      return type.members.map((member) => String(typeDescriptorTextTransformer({ type: member }))).join(' | ');
    case 'array':
      return `${String(typeDescriptorTextTransformer({ type: type.element }))}[]`;
    case 'tuple':
      return `[${type.elements.map((element) => String(typeDescriptorTextTransformer({ type: element }))).join(', ')}]`;
    case 'template': {
      const substitutions = type.types.map((substitution) => String(typeDescriptorTextTransformer({ type: substitution })));
      const body = type.texts.reduce((rendered, text, index) => {
        const substitution = substitutions[index];

        return substitution === undefined ? `${rendered}${String(text)}` : `${rendered}${String(text)}\${${substitution}}`;
      }, '');

      return `\`${body}\``;
    }
    case 'object':
      return (type.typeName === undefined
          ? `{ ${type.properties.map((property) => `${String(property.name)}: ${String(typeDescriptorTextTransformer({ type: property.type }))}`).join('; ')} }`
          : String(type.typeName));
    case 'callable':
      return String(type.text);
    case 'unknown':
      return String(type.text);
    default:
      return 'unknown';
  }
};

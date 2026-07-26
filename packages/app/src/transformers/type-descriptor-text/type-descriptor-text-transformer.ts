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
import { typeTextContract } from '@assayer/shared/contracts';
import type { TypeDescriptor, TypeText } from '@assayer/shared/contracts';

export const typeDescriptorTextTransformer = ({ type }: { type: TypeDescriptor }): TypeText => {
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
      return typeTextContract.parse(
        type.members.map((member) => String(typeDescriptorTextTransformer({ type: member }))).join(' | '),
      );
    case 'array':
      return typeTextContract.parse(`${String(typeDescriptorTextTransformer({ type: type.element }))}[]`);
    case 'tuple':
      return typeTextContract.parse(
        `[${type.elements.map((element) => String(typeDescriptorTextTransformer({ type: element }))).join(', ')}]`,
      );
    case 'template': {
      const substitutions = type.types.map((substitution) => String(typeDescriptorTextTransformer({ type: substitution })));
      const body = type.texts.reduce((rendered, text, index) => {
        const substitution = substitutions[index];

        return substitution === undefined ? `${rendered}${String(text)}` : `${rendered}${String(text)}\${${substitution}}`;
      }, '');

      return typeTextContract.parse(`\`${body}\``);
    }
    case 'object':
      return typeTextContract.parse(
        type.typeName === undefined
          ? `{ ${type.properties.map((property) => `${String(property.name)}: ${String(typeDescriptorTextTransformer({ type: property.type }))}`).join('; ')} }`
          : String(type.typeName),
      );
    case 'callable':
      return typeTextContract.parse(String(type.text));
    case 'unknown':
      return typeTextContract.parse(String(type.text));
    default:
      return typeTextContract.parse('unknown');
  }
};

/**
 * PURPOSE: Renders a serializable type descriptor as its display text for the enrichment panel —
 *   'string'/'number'/'boolean' for primitives, the JSON form of a literal, a `|`-joined list for
 *   a union, `element[]` for an array, an object's NAME (or a braced property list when anonymous),
 *   and the carried text for an opaque unknown type.
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
    case 'object':
      return typeTextContract.parse(
        type.typeName === undefined
          ? `{ ${type.properties.map((property) => `${String(property.name)}: ${String(typeTextTransformer({ type: property.type }))}`).join('; ')} }`
          : String(type.typeName),
      );
    case 'unknown':
      return typeTextContract.parse(type.text);
    default:
      return typeTextContract.parse('string');
  }
};

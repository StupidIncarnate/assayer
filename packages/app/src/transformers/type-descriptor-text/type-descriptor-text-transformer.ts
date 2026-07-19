/**
 * PURPOSE: Renders a serializable TypeDescriptor as compact display text for the detail panel — the
 *   type as a reader sees it in a resolved import's external signature (`string`, `number`, a literal
 *   value, a `a | b` union, or an opaque type's own text). Recurses over union members so a nested or
 *   enumerated shape renders through the same one unit. DISPLAY only — nothing here feeds analysis.
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
    case 'unknown':
      return typeTextContract.parse(String(type.text));
    default:
      return typeTextContract.parse('unknown');
  }
};

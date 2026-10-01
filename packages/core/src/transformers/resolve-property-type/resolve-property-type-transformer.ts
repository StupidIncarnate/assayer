/**
 * PURPOSE: Walks a property PATH into an OBJECT type descriptor, returning the type the path lands on
 *   — the one lookup an object-member operand's real type and an object-member operand's DRIVEN value
 *   both need, so a property chain is walked into a declared shape in exactly one place. Each segment
 *   must land on a property of an `object`-kind descriptor; walking off a segment the shape does not
 *   declare, or through a segment whose own type is not an object (so the path cannot continue), answers
 *   `undefined` rather than guessing a type nothing declares.
 *
 *   An empty path answers the type itself unchanged, so a caller does not need to special-case the
 *   zero-segment leaf its own condition-leaf shape already reads directly off `param.type`.
 *
 * USAGE:
 * resolvePropertyTypeTransformer({
 *   type: { kind: 'object', properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } }] },
 *   path: ['db', 'retry'],
 * });
 * // Returns { kind: 'number' }
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

export const resolvePropertyTypeTransformer = ({
  type,
  path,
}: {
  type: TypeDescriptor;
  path: readonly string[];
}): TypeDescriptor | undefined => {
  const [head, ...rest] = path;

  if (head === undefined) {
    return type;
  }

  if (type.kind !== 'object') {
    return undefined;
  }

  const property = type.properties.find((candidate) => candidate.name === head);

  return property === undefined ? undefined : resolvePropertyTypeTransformer({ type: property.type, path: rest });
};

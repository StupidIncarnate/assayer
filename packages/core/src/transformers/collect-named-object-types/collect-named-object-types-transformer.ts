/**
 * PURPOSE: Collects every NAMED object shape reachable within one type descriptor — the recursive
 *   half of the declared-types projection. It descends array elements, union members and object
 *   properties, emitting a DeclaredType for each object descriptor that carries a `typeName` (an
 *   anonymous shape is skipped — it has no name to key a stub on). A self-referential type is already
 *   truncated to a reference-only object by the reader, so the descriptor is a finite tree and this
 *   recursion terminates without a seen-set.
 *
 * USAGE:
 * collectNamedObjectTypesTransformer({ descriptor: { kind: 'object', typeName: 'Config', properties: [...] } });
 * // Returns [{ name: 'Config', properties: [...] }, ...nested named shapes]
 */
import { declaredTypeContract } from '@assayer/shared/contracts';
import type { DeclaredType, TypeDescriptor } from '@assayer/shared/contracts';

export const collectNamedObjectTypesTransformer = ({ descriptor }: { descriptor: TypeDescriptor }): DeclaredType[] => {
  switch (descriptor.kind) {
    case 'array':
      return collectNamedObjectTypesTransformer({ descriptor: descriptor.element });
    case 'union':
      return descriptor.members.flatMap((member) => collectNamedObjectTypesTransformer({ descriptor: member }));
    case 'object': {
      const nested = descriptor.properties.flatMap((property) =>
        collectNamedObjectTypesTransformer({ descriptor: property.type }),
      );
      return descriptor.typeName === undefined
        ? nested
        : [declaredTypeContract.parse({ name: descriptor.typeName, properties: descriptor.properties }), ...nested];
    }
    case 'string':
    case 'number':
    case 'boolean':
    case 'literal':
    case 'unknown':
      return [];
    default:
      return [];
  }
};

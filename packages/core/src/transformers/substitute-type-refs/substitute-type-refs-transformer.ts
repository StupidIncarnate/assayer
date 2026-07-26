/**
 * PURPOSE: Rewrites every opaque descriptor inside one type with the DECLARED type its reference names
 *   — the write half of the consume-time type resolution, and the exact inverse of
 *   `collect-type-refs`. It descends array elements, union members and object properties by the same
 *   recursion, so `Config[]` becomes an array of the real shape and `{ db: Db }` gets its property
 *   filled in.
 *
 *   The substitutes are already fully resolved by the time they arrive: whoever built the map owns
 *   following an import to its definition, and this only puts the answer where the reference was. A
 *   reference the map does not carry is left exactly as it is, so a type that could not be resolved
 *   stays opaque and the fill seam still refuses it — the invoice is only paid where the shape is
 *   genuinely in hand.
 *
 *   Pure and total: no ts-morph, no disk, no source text.
 *
 * USAGE:
 * substituteTypeRefsTransformer({
 *   type: { kind: 'array', element: { kind: 'unknown', text: 'Config', typeRef: 'Config' } },
 *   resolved: new Map([['Config', { kind: 'object', typeName: 'Config', properties: [] }]]),
 * });
 * // The map is keyed on the reference's declared RENDERING (`Config`, `Box<string>`), which is what
 * // `collect-type-refs` hands back — a bare name cannot tell `Box<string>` from `Box<number>`.
 * // Returns { kind: 'array', element: { kind: 'object', typeName: 'Config', properties: [] } }
 */
import { typeDescriptorContract } from '@assayer/shared/contracts';
import type { TypeDescriptor } from '@assayer/shared/contracts';

import { typeRefKeyTransformer } from '../type-ref-key/type-ref-key-transformer';

export const substituteTypeRefsTransformer = ({
  type,
  resolved,
}: {
  type: TypeDescriptor;
  resolved: ReadonlyMap<string, TypeDescriptor>;
}): TypeDescriptor => {
  switch (type.kind) {
    case 'array':
      return typeDescriptorContract.parse({
        kind: 'array',
        element: substituteTypeRefsTransformer({ type: type.element, resolved }),
        ...(type.cardinality === undefined ? {} : { cardinality: type.cardinality }),
      });
    // Descended the same way an array's element is, one substitution per fixed position.
    case 'tuple':
      return typeDescriptorContract.parse({
        kind: 'tuple',
        elements: type.elements.map((element) => substituteTypeRefsTransformer({ type: element, resolved })),
      });
    // The literal segments carry no reference to resolve; only each substitution's own type does.
    case 'template':
      return typeDescriptorContract.parse({
        kind: 'template',
        texts: type.texts,
        types: type.types.map((substitution) => substituteTypeRefsTransformer({ type: substitution, resolved })),
      });
    case 'union':
      return typeDescriptorContract.parse({
        kind: 'union',
        members: type.members.map((member) => substituteTypeRefsTransformer({ type: member, resolved })),
      });
    case 'object':
      return typeDescriptorContract.parse({
        kind: 'object',
        ...(type.typeName === undefined ? {} : { typeName: type.typeName }),
        ...(type.truncated === true ? { truncated: true } : {}),
        properties: type.properties.map((property) => ({
          name: property.name,
          type: substituteTypeRefsTransformer({ type: property.type, resolved }),
          ...(property.optional === true ? { optional: true } : {}),
        })),
      });
    // Keyed on the reference's declared RENDERING, not on its bare name: `Box<string>` and
    // `Box<number>` are one name and two shapes, so a name-keyed lookup would hand one the other's.
    case 'unknown':
      return type.typeRef === undefined ? type : resolved.get(String(typeRefKeyTransformer({ type }))) ?? type;
    case 'string':
    case 'number':
    case 'boolean':
    case 'literal':
    case 'callable':
    default:
      return type;
  }
};

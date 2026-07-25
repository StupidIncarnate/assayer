/**
 * PURPOSE: Collects every type REFERENCE an opaque descriptor names, anywhere inside one type — the
 *   read half of the consume-time type resolution. The hermetic walk types an imported type as `any`
 *   (§5.10) and records the reference the signature spelled, so `config: Config` names `Config`,
 *   `configs: Config[]` names it on the array's ELEMENT, and `{ db: Db }` names it on a property.
 *
 *   It answers with the opaque DESCRIPTORS rather than bare names, because a name is not the whole
 *   reference: `Box<string>` and `Box<number>` are one name and two different demands, so a resolution
 *   keyed on the name alone would answer one of them with the other's shape. The descriptor carries the
 *   type ARGUMENTS beside the name, and its `text` — the checker's canonical rendering of what the
 *   signature declared — is the KEY both halves agree on. Spelling-invariant, so respacing a signature
 *   moves nothing.
 *
 *   It descends array elements, union members and object properties by the SAME recursion
 *   `collect-named-object-types` uses, and answers in first-seen order with duplicates removed, so the
 *   caller's resolution is asked once per distinct reference and stays byte-stable.
 *
 * USAGE:
 * collectTypeRefsTransformer({ type: { kind: 'array', element: { kind: 'unknown', text: 'Config', typeRef: 'Config' } } });
 * // Returns [{ kind: 'unknown', text: 'Config', typeRef: 'Config' }]
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

import { typeRefKeyTransformer } from '../type-ref-key/type-ref-key-transformer';

export const collectTypeRefsTransformer = ({ type }: { type: TypeDescriptor }): TypeDescriptor[] => {
  const found = ((): TypeDescriptor[] => {
    switch (type.kind) {
      case 'array':
        return collectTypeRefsTransformer({ type: type.element });
      case 'union':
        return type.members.flatMap((member) => collectTypeRefsTransformer({ type: member }));
      case 'object':
        return type.properties.flatMap((property) => collectTypeRefsTransformer({ type: property.type }));
      // The ONE place a reference survives: an opaque type the walk could not enumerate, carrying the
      // name the declaration spelled. A `callable` carries only the checker's rendering and names none.
      // A reference's own type ARGUMENTS may name references too (`Box<Config>`), so they are descended
      // like any other position.
      case 'unknown':
        return type.typeRef === undefined
          ? []
          : [type, ...(type.typeArgs ?? []).flatMap((argument) => collectTypeRefsTransformer({ type: argument }))];
      case 'string':
      case 'number':
      case 'boolean':
      case 'literal':
      case 'callable':
      default:
        return [];
    }
  })();

  return [
    ...new Map(found.map((reference) => [String(typeRefKeyTransformer({ type: reference })), reference] as const)).values(),
  ];
};

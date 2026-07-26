/**
 * PURPOSE: Realizes ONE side of a `typeof` partition into the value-domain shape `type-to-range` hands
 *   back as an arm: which of a type's members carry a given runtime TAG (`wantMatch: true`) or carry a
 *   DIFFERENT, still-known tag (`wantMatch: false`), and the scalar points
 *   `representativeValueTransformer` can name for them.
 *
 *   A non-union type is treated as a one-member union of itself, so a bare `target: string` still
 *   partitions cleanly under `typeof target === 'string'`: every value matches, so the OTHER side is a
 *   genuine `{members: []}` impossibility — that arm can never run — rather than an unconstrained domain.
 *
 *   A member that MATCHES the tag but has no scalar point (an object, an array) still belongs to the
 *   side: the union DOES have a member there, and the fill seam builds it later — this transformer just
 *   cannot NAME a point inside it. So a non-empty match that realizes no scalar points falls back to an
 *   unconstrained domain rather than a false "impossible", the same rule a type with no scalar point at
 *   all narrows by everywhere else in `type-to-range`.
 *
 *   Only a side with NO matching member at all, where some OTHER member's tag IS known, is the genuine
 *   empty domain that marks an arm impossible. A side where every member's tag is unknown (an opaque
 *   type) stays unconstrained instead, for the same reason an `unrecognized` predicate does: this must
 *   never call a reachable arm dead over a type it could not read.
 *
 * USAGE:
 * typeofDomainTransformer({
 *   type: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] },
 *   tag: 'string',
 *   wantMatch: true,
 * });
 * // Returns { members: ['abc123'] }
 */
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeofTagTransformer } from '../typeof-tag/typeof-tag-transformer';
import type { TypeofTag } from '../typeof-tag/typeof-tag-transformer';

export const typeofDomainTransformer = ({
  type,
  tag,
  wantMatch,
}: {
  type: TypeDescriptor;
  tag: TypeofTag;
  wantMatch: boolean;
}): { members?: RepresentativeValue[] } => {
  const members = type.kind === 'union' ? type.members : [type];
  const tags = members.map((member) => typeofTagTransformer({ type: member }));
  const determinate = tags.some((memberTag) => memberTag !== undefined);
  const side = members.filter((_member, index) => (wantMatch ? tags[index] === tag : tags[index] !== undefined && tags[index] !== tag));

  if (side.length === 0) {
    return determinate ? { members: [] } : {};
  }

  const values = side.flatMap((member) => {
    const value = representativeValueTransformer({ type: member });

    return value === undefined ? [] : [value];
  });

  return values.length === 0 ? {} : { members: values };
};

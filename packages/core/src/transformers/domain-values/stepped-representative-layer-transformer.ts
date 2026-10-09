/**
 * PURPOSE: Picks the representative value an open domain should realize to when the type's own
 *   representative is one of the points the domain EXCLUDES. `value === 7` on a number excludes 7 on
 *   its violating arm, and 7 is also the number representative, so a fill would hand that arm the very
 *   value it excludes. This returns the next representative instead: 8 for a number, `'abc123_1'` for a
 *   string, the other member for a union such as `boolean | undefined`.
 *
 *   It returns an EMPTY list when the representative is not excluded, so a caller's ordinary fill
 *   stands unchanged, and when the type has no scalar representative at all.
 *
 * USAGE:
 * steppedRepresentativeLayerTransformer({ type: { kind: 'number' }, excluded: [7] });
 * // Returns [8]
 */
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const steppedRepresentativeLayerTransformer = ({
  type,
  excluded,
}: {
  type: TypeDescriptor;
  excluded: readonly RepresentativeValue[];
}): RepresentativeValue[] => {
  const representative = representativeValueTransformer({ type });

  if (representative === undefined || !excluded.includes(representative)) {
    return [];
  }

  // One more offset than there are excluded points, so an open member (a number, a string) always
  // yields a value the exclusions cannot all cover. A union steps each member, because a literal member
  // ignores the offset and only a different member reaches a different value.
  const members = type.kind === 'union' ? type.members : [type];
  const candidates = Array.from({ length: excluded.length + 1 }, (_, offset) => offset).flatMap((offset) =>
    members.flatMap((member) => {
      const candidate = representativeValueTransformer({ type: member, offset });

      return candidate === undefined ? [] : [candidate];
    }),
  );
  const next = candidates.find((candidate) => !excluded.includes(candidate));

  return next === undefined ? [] : [next];
};

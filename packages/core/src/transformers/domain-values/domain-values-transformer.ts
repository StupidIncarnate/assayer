/**
 * PURPOSE: Picks the concrete values that realize a value domain — the LAST step of derivation, run
 *   only once every guard on the path has narrowed the domain.
 *
 *   Returns a LIST, not a value, because an enumeration must fan out: a union's `else` owes one case
 *   per remaining member, and collapsing that here would delete the tier-2 exhaustive generation. A
 *   bounded numeric domain carries no such obligation — every point inside it drives the same flow —
 *   so it yields exactly one.
 *
 *   A LENGTH-constrained domain is realized as a string of a permitted length rather than picked from
 *   an enumeration, because the guards bounded the length and never named a value. Realizing the length
 *   here — at the end, from the intersected axis — is the whole reason two length guards can coexist:
 *   turning `length >= 3` into a member at classification time would sample it, and the next length
 *   guard would intersect against a single string instead of against a bound.
 *
 *   It picks from the MAX bound where there is one, else the MIN. Not arbitrary: the bound a guard
 *   states is the interesting edge, and preferring the upper one keeps a lone `> 50` arranging 51
 *   while `<= 100 AND > 10` arranges 100. Both satisfy every constraint on their own path, which is
 *   the only property that has to hold. One neighbouring point is offered after it so a single
 *   excluded value cannot strand an otherwise satisfiable domain.
 *
 *   An EMPTY list means the domain constrains nothing, and the caller fills the parameter with its
 *   type's representative value. It never means unsatisfiable — `is-domain-empty` answers that, and
 *   the caller must ask it first, because the two demand opposite responses: fill a value, or report
 *   an exit that cannot be reached.
 *
 *   An open domain that only EXCLUDES points (`value !== 7`) names no value of its own, so that fill
 *   would land on the representative even when the domain excludes it, and both arms of `value === 7`
 *   would then arrange 7. A caller that passes the operand's `type` gets the first representative the
 *   domain does not exclude instead (`stepped-representative`). Without `type`, or when the
 *   representative is not excluded, the list stays empty and the fill stands.
 *
 * USAGE:
 * domainValuesTransformer({ domain: { min: 10, minExclusive: true, max: 100, maxExclusive: false, excluded: [] } });
 * // Returns [100] — one point satisfying both bounds
 * domainValuesTransformer({ domain: { excluded: [7] }, type: { kind: 'number' } });
 * // Returns [8] — the representative 7 is excluded, so the next one
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isLengthInDomainGuard } from '../../guards/is-length-in-domain/is-length-in-domain-guard';
import { isWithinDomainBoundsGuard } from '../../guards/is-within-domain-bounds/is-within-domain-bounds-guard';
import { representativeValueStatics } from '../../statics/representative-value/representative-value-statics';
import { lengthCandidatesTransformer } from '../length-candidates/length-candidates-transformer';
import { steppedRepresentativeLayerTransformer } from './stepped-representative-layer-transformer';

// A length-bounded string is built by slicing this pattern to the required length. The guards bounded
// a LENGTH and said nothing about content, so any deterministic filler satisfies them; a
// multi-character pattern keeps the realized string readable and never the empty string or a run of
// one letter.
const PATTERN = representativeValueStatics.string;

export const domainValuesTransformer = ({
  domain,
  type,
}: {
  domain: ValueDomain;
  type?: TypeDescriptor;
}): RepresentativeValue[] => {
  if (domain.members !== undefined) {
    return domain.members.filter(
      (member) =>
        !domain.excluded.includes(member) &&
        isWithinDomainBoundsGuard({ value: member, domain }) &&
        isLengthInDomainGuard({ value: member, domain }),
    );
  }

  const lengths = lengthCandidatesTransformer({ domain });

  if (lengths !== undefined) {
    return lengths
      .map((length) => {
        const size = length;
        return representativeValueContract.parse(PATTERN.repeat(Math.ceil(size / PATTERN.length)).slice(0, size));
      })
      .filter((candidate) => !domain.excluded.includes(candidate))
      .slice(0, 1);
  }

  const edge =
    domain.max === undefined
      ? domain.min === undefined
        ? undefined
        : { from: domain.min, step: domain.minExclusive ? 1 : 0, next: 1 }
      : { from: domain.max, step: domain.maxExclusive ? -1 : 0, next: -1 };

  if (edge === undefined) {
    return type === undefined ? [] : steppedRepresentativeLayerTransformer({ type, excluded: domain.excluded });
  }

  const preferred = edge.from + edge.step;

  return [preferred, preferred + edge.next]
    .map((candidate) => representativeValueContract.parse(candidate))
    .filter(
      (candidate) =>
        !domain.excluded.includes(candidate) && isWithinDomainBoundsGuard({ value: candidate, domain }),
    )
    .slice(0, 1);
};

/**
 * PURPOSE: Answers whether one concrete value is ADMITTED by a value domain — the whole of its
 *   enumeration, exclusions, numeric bounds, and length axis. It is the membership question object
 *   arrange asks of a stub value: given the domain a branch's requirement narrows a property to, does
 *   this human-supplied-or-derived stub value satisfy it, so the case can prefer it over a fresh fill?
 *
 *   It composes the SAME bounds/length guards `domain-values` filters its picks by, so a value the
 *   domain admits here is exactly one `domain-values` would have been willing to yield — the two never
 *   disagree about a domain. A domain with `members` admits only a listed member; an open domain (an
 *   exclusion, a bound, a length axis) admits anything its constraints do not rule out. A missing
 *   value or domain admits nothing — there is no value to place, so no stub can be preferred.
 *
 * USAGE:
 * isValueInDomainGuard({ value: 'dev', domain: { excluded: ['a'] } });
 * // Returns true — 'dev' is not the excluded 'a', and no bound or length rules it out
 */
import type { RepresentativeValue } from '@assayer/shared/contracts';

import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isLengthInDomainGuard } from '../is-length-in-domain/is-length-in-domain-guard';
import { isWithinDomainBoundsGuard } from '../is-within-domain-bounds/is-within-domain-bounds-guard';

export const isValueInDomainGuard = ({
  value,
  domain,
}: {
  value?: RepresentativeValue;
  domain?: ValueDomain;
}): boolean =>
  value !== undefined &&
  domain !== undefined &&
  (domain.members === undefined || domain.members.includes(value)) &&
  !domain.excluded.includes(value) &&
  isWithinDomainBoundsGuard({ value, domain }) &&
  isLengthInDomainGuard({ value, domain });

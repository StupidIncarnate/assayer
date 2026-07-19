/**
 * PURPOSE: Answers whether one concrete value sits inside a domain's numeric bounds, honouring each
 *   bound's exclusivity.
 *
 *   A NON-NUMERIC value is always within bounds. Bounds come from numeric comparisons, so they say
 *   nothing about a string or a boolean member, and treating "no opinion" as "excluded" would drop
 *   every enumerated member the moment an unrelated numeric guard sat on the same path.
 *
 *   Values and bounds carry different brands — one is a value a case will pass in, the other a limit
 *   a predicate stated — so they are compared as plain numbers here. That widening is the point of the
 *   file: it happens once, where the comparison is the subject, rather than at each of its callers.
 *
 * USAGE:
 * isWithinDomainBoundsGuard({ value: 100, domain: { min: 10, minExclusive: true, max: 100, maxExclusive: false, excluded: [] } });
 * // Returns true — 100 is greater than 10 and at most 100
 */
import type { RepresentativeValue } from '@assayer/shared/contracts';

import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';

export const isWithinDomainBoundsGuard = ({
  value,
  domain,
}: {
  value?: RepresentativeValue;
  domain?: ValueDomain;
}): boolean => {
  if (domain === undefined || typeof value !== 'number') {
    return true;
  }

  const point = Number(value);
  const min = domain.min === undefined ? undefined : Number(domain.min);
  const max = domain.max === undefined ? undefined : Number(domain.max);

  const aboveMin = min === undefined || point > min || (point === min && !domain.minExclusive);
  const belowMax = max === undefined || point < max || (point === max && !domain.maxExclusive);

  return aboveMin && belowMax;
};

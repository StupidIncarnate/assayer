/**
 * PURPOSE: Answers whether one concrete value's LENGTH sits inside a domain's length axis — its bounds,
 *   honouring exclusivity, and its ruled-out lengths.
 *
 *   A value with no length — a number, a boolean — is always allowed. The length axis states nothing
 *   about them, and reading "no opinion" as "excluded" would drop every enumerated member the moment an
 *   unrelated `.length` guard shared the operand.
 *
 *   It takes the VALUE rather than a length so callers never have to ask what has one, which is the
 *   same reason `is-within-domain-bounds` takes the value rather than a number.
 *
 * USAGE:
 * isLengthInDomainGuard({ value: 'aa', domain: { lengthMin: 2, lengthMax: 5, … } });
 * // Returns true — 'aa' is between two and five characters long
 */
import type { RepresentativeValue } from '@assayer/shared/contracts';

import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';

export const isLengthInDomainGuard = ({
  value,
  domain,
}: {
  value?: RepresentativeValue;
  domain?: ValueDomain;
}): boolean => {
  if (domain === undefined || typeof value !== 'string') {
    return true;
  }

  const { length } = value;
  const min = domain.lengthMin === undefined ? undefined : Number(domain.lengthMin);
  const max = domain.lengthMax === undefined ? undefined : Number(domain.lengthMax);

  const aboveMin = min === undefined || length > min || (length === min && !domain.lengthMinExclusive);
  const belowMax = max === undefined || length < max || (length === max && !domain.lengthMaxExclusive);
  const allowed = !domain.lengthExcluded.map((excluded) => Number(excluded)).includes(length);

  return aboveMin && belowMax && allowed;
};

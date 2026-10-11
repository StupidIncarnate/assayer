/**
 * PURPOSE: Answers whether one concrete value satisfies a domain's TEXT axis: every substring the domain
 *   requires (`includes`) is in the value, and no substring it forbids (`notIncludes`) is. A value that
 *   is not a string is always allowed: the text axis states nothing about a number or a boolean, and
 *   reading "no opinion" as "excluded" would drop every enumerated member the moment an unrelated
 *   `.includes` guard shared the operand.
 *
 * USAGE:
 * isTextInDomainGuard({ value: 'on', domain: { includes: ['on'], excluded: [], … } });
 * // Returns true — 'on' contains the required text
 */
import type { RepresentativeValue } from '@assayer/shared/contracts';

import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';

export const isTextInDomainGuard = ({
  value,
  domain,
}: {
  value?: RepresentativeValue;
  domain?: ValueDomain;
}): boolean =>
  domain === undefined ||
  typeof value !== 'string' ||
  ((domain.includes ?? []).every((required) => value.includes(required)) &&
    (domain.notIncludes ?? []).every((forbidden) => !value.includes(forbidden)));

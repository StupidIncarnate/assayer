/**
 * PURPOSE: Finds the string to write into an environment variable so that, after the code's own steps
 *   run, the operand holds a value its domain admits. `cause-arrange` calls it once per environment
 *   operand a case constrains, with the domain every guard on that case's path narrowed it to.
 *
 *   It runs the steps BACKWARDS, last step first. At each step it picks the value the operand must
 *   hold there, then asks what the step before must produce to give it:
 *   - `number` picks a number and writes it with `String`, its exact inverse.
 *   - `equals` picks a boolean. `true` needs the literal itself, and `false` needs any value other
 *     than the literal.
 *   - `split` picks the shortest length the domain allows (never 0, which no split produces) and joins
 *     that many one-character items with the separator. The item is a character the separator does not
 *     contain, so joining adds no extra separator.
 *   - `map` and `default` change nothing a case asks about, so the domain passes through.
 *   The raw read at the bottom writes the value it picked as a string.
 *
 *   A value is picked the way `cause-arrange` picks one for a parameter: the domain's own value when
 *   it names one, or else the type's representative when the domain admits it. That second half is
 *   what lets `if (Number(process.env.X))` reach its truthy arm: "anything but 0" names no value, and
 *   the representative 7 is one it admits.
 *
 *   It answers `undefined` when no string can be found, and the case then writes no variable. Values
 *   come from the domain and the steps, never from running the code (P4).
 *
 * USAGE:
 * envEncodeTransformer({ steps: [{ kind: 'equals', literal: 'true', negated: false }], domain: { members: [false] }, type: { kind: 'boolean' } });
 * // Returns 'abc123' — any string but 'true' makes the comparison false
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { EnvStep, TypeDescriptor } from '@assayer/shared/contracts';

import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isValueInDomainGuard } from '../../guards/is-value-in-domain/is-value-in-domain-guard';
import { envSourceStatics } from '../../statics/env-source/env-source-statics';
import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { envStepsTypeTransformer } from '../env-steps-type/env-steps-type-transformer';
import { intersectDomainsTransformer } from '../intersect-domains/intersect-domains-transformer';
import { lengthCandidatesTransformer } from '../length-candidates/length-candidates-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const envEncodeTransformer = ({
  steps,
  domain,
  type,
}: {
  steps: readonly EnvStep[];
  domain: ValueDomain;
  type: TypeDescriptor;
}): string | undefined => {
  const last = steps[steps.length - 1];
  const rest = steps.slice(0, -1);
  const restType = envStepsTypeTransformer({ steps: rest });
  const [named] = domainValuesTransformer({ domain, type });
  const representative = representativeValueTransformer({ type });
  const point =
    named ??
    (representative !== undefined && isValueInDomainGuard({ value: representative, domain }) ? representative : undefined);

  if (last === undefined) {
    return typeof point === 'string' || typeof point === 'number' ? String(point) : undefined;
  }

  switch (last.kind) {
    case 'number':
      return typeof point === 'number'
        ? envEncodeTransformer({
            steps: rest,
            domain: valueDomainContract.parse({ members: [representativeValueContract.parse(String(point))] }),
            type: restType,
          })
        : undefined;
    case 'equals': {
      if (typeof point !== 'boolean') {
        return undefined;
      }

      const literal = representativeValueContract.parse(last.literal);
      const holds = point !== last.negated;

      return envEncodeTransformer({
        steps: rest,
        domain: valueDomainContract.parse(holds ? { members: [literal] } : { excluded: [literal] }),
        type: restType,
      });
    }
    case 'split': {
      const [count] =
        lengthCandidatesTransformer({
          domain: intersectDomainsTransformer({ left: domain, right: valueDomainContract.parse({ lengthMin: 1 }) }),
        }) ?? [];
      const item = envSourceStatics.fillers.find((character) => !last.separator.includes(character));

      return count === undefined || item === undefined
        ? undefined
        : envEncodeTransformer({
            steps: rest,
            domain: valueDomainContract.parse({
              members: [representativeValueContract.parse(Array.from({ length: count }, () => item).join(last.separator))],
            }),
            type: restType,
          });
    }
    case 'map':
    case 'default':
    default:
      return envEncodeTransformer({ steps: rest, domain, type: restType });
  }
};

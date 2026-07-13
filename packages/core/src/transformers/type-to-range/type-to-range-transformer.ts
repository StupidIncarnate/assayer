/**
 * PURPOSE: Derives the satisfying vs violating representative value sets for a branch predicate on
 *   a typed operand — the "data range" per arm. Sourced from the operand's type + the predicate,
 *   never from executing the code (P4). Deterministic, and extended by adding one switch case.
 *
 * USAGE:
 * typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-eq-zero' });
 * // Returns { satisfying: [''], violating: ['a'] } (branded ArmValues)
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

import { armValuesContract } from '../../contracts/arm-values/arm-values-contract';
import type { ArmValues } from '../../contracts/arm-values/arm-values-contract';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const typeToRangeTransformer = ({
  type,
  predicateKind,
  literal,
}: {
  type: TypeDescriptor;
  predicateKind: string;
  literal?: string | number | boolean;
}): ArmValues => {
  const rep = representativeValueTransformer({ type });
  const num = typeof literal === 'number' ? literal : 0;
  const distinct =
    literal === undefined
      ? rep
      : typeof literal === 'number'
        ? literal + 1
        : typeof literal === 'boolean'
          ? !literal
          : `${literal}x`;
  const unionOthers =
    type.kind === 'union'
      ? type.members.flatMap((member) =>
          member.kind === 'literal' && member.value !== literal ? [member.value] : [],
        )
      : [];
  const eqViolating = unionOthers.length > 0 ? unionOthers : [distinct];

  switch (predicateKind) {
    case 'length-eq-zero':
      return armValuesContract.parse({ satisfying: [''], violating: ['a'] });
    case 'length-gt-zero':
      return armValuesContract.parse({ satisfying: ['a'], violating: [''] });
    case 'eq':
      return armValuesContract.parse({ satisfying: [literal ?? rep], violating: eqViolating });
    case 'neq':
      return armValuesContract.parse({ satisfying: eqViolating, violating: [literal ?? rep] });
    case 'gt':
      return armValuesContract.parse({ satisfying: [num + 1], violating: [num] });
    case 'gte':
      return armValuesContract.parse({ satisfying: [num], violating: [num - 1] });
    case 'lt':
      return armValuesContract.parse({ satisfying: [num - 1], violating: [num] });
    case 'lte':
      return armValuesContract.parse({ satisfying: [num], violating: [num + 1] });
    case 'truthy':
      return armValuesContract.parse(
        type.kind === 'number'
          ? { satisfying: [1], violating: [0] }
          : type.kind === 'boolean'
            ? { satisfying: [true], violating: [false] }
            : { satisfying: ['a'], violating: [''] },
      );
    case 'falsy':
      return armValuesContract.parse(
        type.kind === 'number'
          ? { satisfying: [0], violating: [1] }
          : type.kind === 'boolean'
            ? { satisfying: [false], violating: [true] }
            : { satisfying: [''], violating: ['a'] },
      );
    default:
      return armValuesContract.parse({ satisfying: [rep], violating: [rep] });
  }
};

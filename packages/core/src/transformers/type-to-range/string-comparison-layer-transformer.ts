/**
 * PURPOSE: Derives satisfying and violating value domains for string comparison predicates
 *   (`gt`, `gte`, `lt`, `lte`).
 *
 * USAGE:
 * stringComparisonLayerTransformer({ predicateKind: 'gt', literal: 'm' });
 * // Returns { satisfying: { members: ['ma'] }, violating: { members: ['m'] } }
 */
import { armValuesContract } from '../../contracts/arm-values/arm-values-contract';
import type { ArmValues } from '../../contracts/arm-values/arm-values-contract';

export const stringComparisonLayerTransformer = ({
  predicateKind,
  literal,
}: {
  predicateKind: 'gt' | 'gte' | 'lt' | 'lte';
  literal: string;
}): ArmValues => {
  switch (predicateKind) {
    case 'gt':
      return armValuesContract.parse({
        satisfying: { members: [`${literal}a`] },
        violating: { members: [literal] },
      });
    case 'gte':
      return armValuesContract.parse({
        satisfying: { members: [literal] },
        violating: { members: literal === '' ? [] : [''] },
      });
    case 'lt':
      return armValuesContract.parse({
        satisfying: { members: literal === '' ? [] : [''] },
        violating: { members: [literal] },
      });
    case 'lte':
      return armValuesContract.parse({
        satisfying: { members: [literal] },
        violating: { members: [`${literal}a`] },
      });
    default:
      return armValuesContract.parse({ satisfying: {}, violating: {} });
  }
};

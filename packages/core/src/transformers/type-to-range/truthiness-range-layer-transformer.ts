/**
 * PURPOSE: Derives satisfying and violating value domains for the truthiness predicates (`truthy`,
 *   `falsy`). A union with a falsy point among its members (`number | undefined` has 0,
 *   `boolean | undefined` has `false`) is truthy everywhere but those points, and falsy exactly at them,
 *   so it reads the way a lone `number` does: an exclusion on one side, the points on the other. Sampling
 *   the truthy side instead would make a welded constant intersect it to nothing and report a live arm
 *   dead. A union with no such point keeps the representative reading: the type's own representative on
 *   the truthy side and the empty string on the other. A type with no scalar point constrains nothing.
 *
 * USAGE:
 * truthinessRangeLayerTransformer({ type: { kind: 'number' }, predicateKind: 'truthy' });
 * // Returns { satisfying: { excluded: [0] }, violating: { members: [0] } }
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

import { armValuesContract } from '../../contracts/arm-values/arm-values-contract';
import type { ArmValues } from '../../contracts/arm-values/arm-values-contract';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const truthinessRangeLayerTransformer = ({
  type,
  predicateKind,
}: {
  type: TypeDescriptor;
  predicateKind: 'truthy' | 'falsy';
}): ArmValues => {
  const rep = representativeValueTransformer({ type });
  const unrealizable = armValuesContract.parse({ satisfying: {}, violating: {} });
  // The falsy value each scalar member of a union can take: `0`, `''`, `false`, or a falsy literal
  // member itself. Read in member order, so the list is deterministic.
  const falsyPoints: RepresentativeValue[] =
    type.kind === 'union'
      ? type.members
          .flatMap((member): RepresentativeValue[] =>
            member.kind === 'number'
              ? [representativeValueContract.parse(0)]
              : member.kind === 'string'
                ? [representativeValueContract.parse('')]
                : member.kind === 'boolean'
                  ? [representativeValueContract.parse(false)]
                  : member.kind === 'literal' && !member.value
                    ? [member.value]
                    : [],
          )
          .filter((point, index, all) => all.indexOf(point) === index)
      : [];

  if (predicateKind === 'truthy') {
    return type.kind === 'number'
      ? armValuesContract.parse({
          satisfying: { excluded: [0] },
          violating: { members: [0] },
        })
      : type.kind === 'boolean'
        ? armValuesContract.parse({
            satisfying: { members: [true] },
            violating: { members: [false] },
          })
        : falsyPoints.length > 0
          ? armValuesContract.parse({
              satisfying: { excluded: falsyPoints },
              violating: { members: falsyPoints },
            })
          : rep === undefined
            ? unrealizable
            : armValuesContract.parse({
                satisfying: { members: [rep] },
                violating: { members: [''] },
              });
  }

  return type.kind === 'number'
    ? armValuesContract.parse({
          satisfying: { members: [0] },
          violating: { excluded: [0] },
        })
      : type.kind === 'boolean'
        ? armValuesContract.parse({
            satisfying: { members: [false] },
            violating: { members: [true] },
          })
        : falsyPoints.length > 0
          ? armValuesContract.parse({
              satisfying: { members: falsyPoints },
              violating: { excluded: falsyPoints },
            })
          : rep === undefined
            ? unrealizable
            : armValuesContract.parse({
                satisfying: { members: [''] },
                violating: { members: [rep] },
              });
};

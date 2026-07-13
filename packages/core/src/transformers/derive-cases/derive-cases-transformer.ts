/**
 * PURPOSE: Derives the salient test cases for an entry — per reachable exit, the cartesian product of
 *   each guarding branch's arm value set bound to its operand param, with any unconstrained param
 *   filled by its representative value. A single-valued arm (e.g. a string length check) yields one
 *   case per exit; a multi-member arm (an enum's `else`, whose violating set is every OTHER member)
 *   fans out exhaustively — one case per member (tier-2). Each case asserts reaching the exit
 *   (structural, P4) — it never records the returned value.
 *
 * USAGE:
 * deriveCasesTransformer({ params, branches, exits });
 * // Returns [{ reachesExit, arrange: [{ param, value }] }, ...] (branded DerivedTestCase[])
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type {
  DerivedTestCase,
  ParamDescriptor,
  BranchNode,
  ExitNode,
  RepresentativeValue,
  SymbolName,
} from '@assayer/shared/contracts';

import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';

export const deriveCasesTransformer = ({
  params,
  branches,
  exits,
}: {
  params: ParamDescriptor[];
  branches: BranchNode[];
  exits: ExitNode[];
}): DerivedTestCase[] => {
  const rangeByBranch = new Map(
    branches.map((branch) => [
      branch.coverageId,
      {
        operand: branch.operandParamName,
        armValues: typeToRangeTransformer({
          type: branch.operandType,
          predicateKind: branch.predicate.kind,
          ...(branch.predicate.literal === undefined ? {} : { literal: branch.predicate.literal }),
        }),
      },
    ]),
  );

  return exits.flatMap((exit) => {
    const stepChoices = exit.guardPath.flatMap((step) => {
      const range = rangeByBranch.get(step.branchCoverageId);
      const operand = range?.operand;
      if (range === undefined || operand === undefined) {
        return [];
      }
      const values = step.arm === 'else' ? range.armValues.violating : range.armValues.satisfying;
      return values.length === 0 ? [] : [{ operand, values }];
    });

    const bindings = stepChoices.reduce<Map<SymbolName, RepresentativeValue>[]>(
      (combos, choice) =>
        combos.flatMap((combo) =>
          choice.values.map((value) => new Map(combo).set(choice.operand, value)),
        ),
      [new Map<SymbolName, RepresentativeValue>()],
    );

    return bindings.map((bound) => {
      const arrange = params.map((param) => {
        const existing = bound.get(param.name);
        return {
          param: param.name,
          value: existing === undefined ? representativeValueTransformer({ type: param.type }) : existing,
        };
      });

      return derivedTestCaseContract.parse({ reachesExit: exit.coverageId, arrange });
    });
  });
};

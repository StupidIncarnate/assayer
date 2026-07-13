/**
 * PURPOSE: Derives the salient test cases for an entry — one per reachable exit. For each exit it
 *   walks the guard path, choosing each guarding branch's arm representative for the operand param,
 *   then fills any unconstrained param with its representative value. The case asserts reaching the
 *   exit (structural, P4) — it never records the returned value.
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

  return exits.map((exit) => {
    const bound = new Map<SymbolName, RepresentativeValue>();
    exit.guardPath.forEach((step) => {
      const range = rangeByBranch.get(step.branchCoverageId);
      const operand = range?.operand;
      if (range === undefined || operand === undefined) {
        return;
      }
      const chosen =
        step.arm === 'else' ? range.armValues.violating[0] : range.armValues.satisfying[0];
      if (chosen !== undefined) {
        bound.set(operand, chosen);
      }
    });

    const arrange = params.map((param) => {
      const existing = bound.get(param.name);
      return {
        param: param.name,
        value: existing === undefined ? representativeValueTransformer({ type: param.type }) : existing,
      };
    });

    return derivedTestCaseContract.parse({ reachesExit: exit.coverageId, arrange });
  });
};

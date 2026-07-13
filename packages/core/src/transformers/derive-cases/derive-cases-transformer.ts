/**
 * PURPOSE: Derives the salient test cases for an entry — per reachable exit, groups its guard steps
 *   by operand, INTERSECTS each operand's per-step value sets (satisfying for a `then` step, violating
 *   for an `else` step, from the type→range engine), then cartesian-products the surviving choices
 *   ACROSS DISTINCT operands, filling any unconstrained param with its representative value. Same-
 *   operand steps intersect (so a `switch` default's N `else` steps on one discriminant collapse to the
 *   single uncovered member); different operands stay independent. A single-valued arm (a string length
 *   check) yields one case per exit; a multi-member arm (an enum's `else`) fans out exhaustively — one
 *   case per member (tier-2). An empty intersection is skipped so the operand falls back to
 *   representative fill and every exit still yields at least one case. Each case asserts reaching the
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

  return exits.flatMap((exit) => {
    const intersectionByOperand = exit.guardPath.reduce<Map<SymbolName, RepresentativeValue[]>>(
      (acc, step) => {
        const range = rangeByBranch.get(step.branchCoverageId);
        const operand = range?.operand;
        if (range === undefined || operand === undefined) {
          return acc;
        }
        const values = step.arm === 'else' ? range.armValues.violating : range.armValues.satisfying;
        const existing = acc.get(operand);
        const next = existing === undefined ? values : existing.filter((value) => values.includes(value));
        return acc.set(operand, next);
      },
      new Map<SymbolName, RepresentativeValue[]>(),
    );

    const operandChoices = [...intersectionByOperand.entries()].flatMap(([operand, values]) =>
      values.length === 0 ? [] : [{ operand, values }],
    );

    const bindings = operandChoices.reduce<Map<SymbolName, RepresentativeValue>[]>(
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

/**
 * PURPOSE: Resolves the requirements of ONE route against the arms that route took. A leaf that reads a
 *   local variable carries what the variable holds as an expression (`operandFlow`); the route's arms
 *   decide every choice in it, which leaves one of three things:
 *   - a parameter: the leaf is rewritten to read that parameter, so it narrows the parameter's domain
 *     with every other guard on it;
 *   - a literal: the leaf is rewritten as WELDED to that value, so it is evaluated and not steered;
 *   - a function of parameters (`trim(n)`): it cannot narrow a domain. It is returned as a derived
 *     requirement, to be settled once the parameters' values are known.
 *   A leaf with no flow is returned as it is. A flow that depends on a branch the route never took leaves
 *   the question undecided, and `undecidable` says so: nothing here guesses.
 *
 * USAGE:
 * routeResolveTransformer({ requirements, armByBranch, params });
 * // Returns { requirements: [...], derived: [{ leaf, want, expr }], undecidable: false }
 */
import type { ConditionLeaf, ParamDescriptor, ValueExpr } from '@assayer/shared/contracts';
import { conditionLeafContract } from '@assayer/shared/contracts';

import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import { valueExprResolveTransformer } from '../value-expr-resolve/value-expr-resolve-transformer';

export const routeResolveTransformer = ({
  requirements,
  armByBranch,
  params,
}: {
  requirements: ConditionCause['requirements'];
  armByBranch: ReadonlyMap<string, string>;
  params: ParamDescriptor[];
}): {
  requirements: ConditionCause['requirements'];
  derived: { leaf: ConditionLeaf; want: boolean; expr: ValueExpr }[];
  undecidable: boolean;
} => {
  const resolved = requirements.map((requirement) => {
    const { leaf } = requirement;
    const { operandFlow, ...rest } = leaf;

    if (operandFlow === undefined) {
      return { kind: 'plain' as const, requirement };
    }

    const expr = valueExprResolveTransformer({ expr: operandFlow, armByBranch });

    if (expr === undefined) {
      return { kind: 'undecided' as const };
    }

    if (expr.kind === 'lit') {
      // Named by the leaf itself: two leaves of one variable can resolve to different values on one route,
      // so the variable's own name would merge them into one domain.
      return {
        kind: 'plain' as const,
        requirement: {
          ...requirement,
          leaf: conditionLeafContract.parse({ ...rest, operandParamName: String(leaf.id), operandConstValue: expr.value }),
        },
      };
    }

    if (expr.kind === 'param') {
      const param = params.find((candidate) => String(candidate.name) === expr.name);

      return param === undefined
        ? { kind: 'undecided' as const }
        : {
            kind: 'plain' as const,
            requirement: {
              ...requirement,
              leaf: conditionLeafContract.parse({ ...rest, operandParamName: expr.name, operandType: param.type }),
            },
          };
    }

    return { kind: 'derived' as const, leaf, want: requirement.want, expr };
  });

  return {
    requirements: resolved.flatMap((entry) => (entry.kind === 'plain' ? [entry.requirement] : [])),
    derived: resolved.flatMap((entry) => (entry.kind === 'derived' ? [{ leaf: entry.leaf, want: entry.want, expr: entry.expr }] : [])),
    undecidable: resolved.some((entry) => entry.kind === 'undecided'),
  };
};

/**
 * PURPOSE: Reads a `??` chain's controlling operand as a single NON-NULLISH leaf — the one condition
 *   `read-condition-tree` cannot supply, because it reads a bare operand as TRUTHY and `??` tests
 *   null/undefined, not falsiness. `'' ?? b` returns `''` (the empty string is not nullish) where
 *   `'' || b` returns `b`, so the two operators owe different leaves over the same operand.
 *
 *   The leaf keys on the branch's coverage ID (`#leaf`) exactly as a truthy operand does, types the
 *   operand through `read-operand-type` (so `a: string | null` carries its declared type), and marks
 *   the operand a `non-nullish` predicate. Its predicate carries no literal — the type→range engine
 *   partitions the operand's type into its non-null values and null. The operand's SYMBOL name is
 *   recorded when it is a bare identifier, so a param operand can be arranged; anything else stays
 *   unnamed and falls back to a representative fill.
 *
 *   Like `read-condition-tree` it emits the leaf's probe site, but the `??` split discards it: the
 *   controlling operand's span already carries the exit probe, and injection wraps a span once.
 *
 * USAGE:
 * readNullishLeafLayerAdapter({ operand: nullishChain.getLeft(), context, branchCoverageId });
 * // Returns { condition: { kind: 'leaf', predicate: { kind: 'non-nullish' }, … }, sites: [{ id, kind: 'cond', … }] }
 */
import { Node } from 'ts-morph';

import { conditionNodeContract, coverageIdContract, predicateContract, symbolNameContract } from '@assayer/shared/contracts';
import type { ConditionNode, CoverageId } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import type { ProbeSite } from '../../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { readOperandTypeLayerAdapter } from './read-operand-type-layer-adapter';

export interface NullishLeafReadout {
  condition: ConditionNode;
  sites: ProbeSite[];
}

export const readNullishLeafLayerAdapter = ({
  operand,
  context,
  branchCoverageId,
}: {
  operand: Node;
  context: WalkContext;
  branchCoverageId: CoverageId;
}): NullishLeafReadout => {
  const id = coverageIdContract.parse(`${branchCoverageId}#leaf`);
  const operandName = Node.isIdentifier(operand) ? symbolNameContract.parse(operand.getText()) : undefined;

  return {
    condition: conditionNodeContract.parse({
      kind: 'leaf',
      id,
      ...(operandName === undefined ? {} : { operandParamName: operandName }),
      operandType: readOperandTypeLayerAdapter({
        node: operand,
        context,
        ...(operandName === undefined ? {} : { name: operandName }),
      }),
      predicate: predicateContract.parse({ kind: 'non-nullish' }),
    }),
    sites: [probeSiteContract.parse({ id, kind: 'cond', start: operand.getStart(), end: operand.getEnd() })],
  };
};

/**
 * PURPOSE: Contract for a condition node — the decomposed boolean structure of a branch's condition,
 *   as a tree of connectives (`&&`, `||`, `!`) over LEAF comparisons. A single comparison is a
 *   one-leaf tree, so there is exactly ONE encoding of "what a branch tests" rather than a flat
 *   predicate plus a compound special case.
 *
 *   Decomposition is what makes a compound condition analyzable at all: each leaf carries its own
 *   operand, type and predicate, so the range engine can derive values per leaf, and each leaf's `id`
 *   addresses it individually for coverage. Without the tree, `a > 5 && b < 3` is one opaque operand
 *   with an `unrecognized` predicate — undecidable and silently unsound.
 *
 *   Leaves carry their own ids (see `condition-leaf`), so each is individually addressable for
 *   coverage.
 *
 * USAGE:
 * conditionNodeContract.parse({
 *   kind: 'and',
 *   left: { kind: 'leaf', id: '…#leaf.0', operandParamName: 'score', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
 *   right: { kind: 'leaf', id: '…#leaf.1', operandParamName: 'bonus', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 1 } },
 * });
 * // Returns a validated ConditionNode (recursive discriminated union)
 */
import { z } from 'zod';

import { conditionLeafContract } from '../condition-leaf/condition-leaf-contract';
import type { ConditionLeaf } from '../condition-leaf/condition-leaf-contract';

export type ConditionNode =
  | ConditionLeaf
  | { kind: 'not'; operand: ConditionNode }
  | { kind: 'and'; left: ConditionNode; right: ConditionNode }
  | { kind: 'or'; left: ConditionNode; right: ConditionNode };

export const conditionNodeContract: z.ZodType<ConditionNode, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    conditionLeafContract,
    z.object({ kind: z.literal('not'), operand: conditionNodeContract }),
    z.object({ kind: z.literal('and'), left: conditionNodeContract, right: conditionNodeContract }),
    z.object({ kind: z.literal('or'), left: conditionNodeContract, right: conditionNodeContract }),
  ]),
);

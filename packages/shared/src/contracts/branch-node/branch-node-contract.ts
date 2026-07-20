/**
 * PURPOSE: Contract for a branch node — a conditional construct (if/switch/ternary) in an entry,
 *   carrying its cache-internal coverage ID (the whole condition's structural projection), the
 *   decomposed CONDITION TREE it tests, and its rendered line span. Identity is fully AST-derived —
 *   no source-text field.
 *
 *   The condition is a tree rather than a flat operand+predicate so that ONE encoding covers every
 *   condition: a simple comparison is a one-leaf tree, and `a > 5 && b < 3` decomposes into leaves
 *   the range engine can derive values for. The flat shape could not express a compound condition at
 *   all — it collapsed to one opaque operand with an `unrecognized` predicate, which made both arms
 *   derive identical values and silently claim exits those values cannot reach.
 *
 * USAGE:
 * branchNodeContract.parse({
 *   coverageId: 'formatGreeting/if:BinaryExpression,id:name,…', kind: 'if',
 *   condition: { kind: 'leaf', id: '…#leaf', operandParamName: 'name', operandType: { kind: 'string' }, predicate: { kind: 'length-eq', literal: 0 } },
 *   startLine: 2, endLine: 4,
 * });
 * // Returns a validated BranchNode (branded fields)
 */
import { z } from 'zod';

import { conditionNodeContract } from '../condition-node/condition-node-contract';
import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const branchNodeContract = z.object({
  coverageId: coverageIdContract,
  // Exactly the kinds the walk EMITS — a handler exists for each. Syntax the walk cannot follow is a
  // dark spot, not a branch, so naming a kind here that nothing emits would oblige every consumer to
  // handle a case that cannot occur. Add a kind when its handler lands, never before.
  kind: z.enum(['if', 'switch', 'ternary']).brand<'BranchKind'>(),
  condition: conditionNodeContract,
  startLine: lineNumberContract,
  endLine: lineNumberContract,
});

export type BranchNode = z.infer<typeof branchNodeContract>;

/**
 * PURPOSE: Reads a condition into the operand under test plus its parsed predicate. It pulls only
 *   RAW comparison facts off the AST (the operator token's kind, whether the left side is a
 *   `.length` access, the right-hand literal's value) and hands them to `predicateTransformer`,
 *   which is the single owner of predicate CLASSIFICATION — no comparison semantics are encoded
 *   here. A condition that is not a comparison yields an `unrecognized` predicate and the whole
 *   expression as its operand.
 *
 *   The right-hand literal is read the same way whether or not the left side is `.length`: a length
 *   comparison states a THRESHOLD, and dropping it left every length check but the two against zero
 *   with nothing to classify.
 *
 *   It takes the condition EXPRESSION rather than the `if` that owns it, so a ternary, a `while`,
 *   or a `do` can reuse it unchanged when their handlers arrive.
 *
 * USAGE:
 * readConditionLayerAdapter({ condition: ifStatement.getExpression() });
 * // Returns { operandNode, operandName: 'name', predicate: { kind: 'length-eq', literal: 0 } }
 */
import { Node } from 'ts-morph';

import { representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';
import type { Predicate, SymbolName } from '@assayer/shared/contracts';

import { predicateTransformer } from '../../../transformers/predicate/predicate-transformer';

export interface ConditionReadout {
  operandNode: Node;
  operandName?: SymbolName;
  predicate: Predicate;
}

export const readConditionLayerAdapter = ({ condition }: { condition: Node }): ConditionReadout => {
  const binary = Node.isBinaryExpression(condition) ? condition : undefined;
  const left = binary?.getLeft();
  const right = binary?.getRight();
  const opKind = binary === undefined ? '' : binary.getOperatorToken().getKindName();
  const isLengthAccess = left !== undefined && Node.isPropertyAccessExpression(left) && left.getName() === 'length';
  const operandNode: Node =
    left === undefined ? condition : isLengthAccess && Node.isPropertyAccessExpression(left) ? left.getExpression() : left;
  const rightLiteral =
    right === undefined
      ? undefined
      : Node.isStringLiteral(right)
        ? representativeValueContract.parse(right.getLiteralValue())
        : Node.isNumericLiteral(right)
          ? representativeValueContract.parse(right.getLiteralValue())
          : right.getKindName() === 'TrueKeyword'
            ? representativeValueContract.parse(true)
            : right.getKindName() === 'FalseKeyword'
              ? representativeValueContract.parse(false)
              : undefined;
  const operandName = Node.isIdentifier(operandNode) ? symbolNameContract.parse(operandNode.getText()) : undefined;

  return {
    operandNode,
    ...(operandName === undefined ? {} : { operandName }),
    predicate: predicateTransformer({
      opKind,
      isLengthAccess,
      ...(rightLiteral === undefined ? {} : { rightLiteral }),
    }),
  };
};

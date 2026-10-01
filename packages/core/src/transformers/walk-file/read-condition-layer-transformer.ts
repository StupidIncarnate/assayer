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
 *   `null` is a KEYWORD node (`NullKeyword`) and reads as the literal value `null`, which is a
 *   first-class `RepresentativeValue` (`representative-value-contract`) — so `v === null` reads
 *   exactly as `v === 'a'` does. `undefined` is not a keyword but an IDENTIFIER, and stays unread:
 *   `RepresentativeValue` has no `undefined` member, so there is no domain value to carry even if the
 *   identifier were resolved.
 *
 *   It takes the condition EXPRESSION rather than the `if` that owns it, so a ternary, a `while`,
 *   or a `do` can reuse it unchanged when their handlers arrive.
 *
 *   An OBJECT-MEMBER operand (`config.mode`) is read past the property access: `operandRootName` is the
 *   leftmost identifier (`config`), `operandPropertyPath` the `.member` chain off it (`['mode']`), and
 *   `operandTypeRef` the type-reference NAME the root param declares (`Config`, read off
 *   `param.getTypeNode()` — a §5.1-sanctioned type-reference name). The predicate and the operand's own
 *   type read exactly as for any other operand; the extra fields are the stub stitch's foreign key.
 *
 *   A `typeof` operand (`typeof target === 'string'`) is read PAST the `typeof` keyword, exactly as a
 *   `.length` operand is read past the property access: `operandNode` becomes the expression `typeof`
 *   applies to (`target`), so an identifier reads as that identifier's own name and an object-member
 *   read still decomposes into its root and path. `operandIsTypeof` marks that the comparison is a
 *   `typeof` READ rather than a direct comparison of the operand's own value, which is what lets
 *   `predicateTransformer` classify it onto the runtime-tag axis instead of the value axis: the
 *   deciding value is genuinely `target`, but what it is compared against is a TAG, not a value of
 *   `target`'s own type.
 *
 * USAGE:
 * readConditionLayerAdapter({ condition: ifStatement.getExpression() });
 * // Returns { operandNode, operandName: 'name', predicate: { kind: 'length-eq', literal: 0 } }
 */
import { Node } from '#gateway/npm/ts-morph';

import { representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';
import type { Predicate, SymbolName } from '@assayer/shared/contracts';

import { predicateTransformer } from '../predicate/predicate-transformer';
import { readPropertyPathLayerTransformer } from './read-property-path-layer-transformer';

export interface ConditionReadout {
  operandNode: Node;
  operandName?: SymbolName;
  operandRootName?: SymbolName;
  operandPropertyPath?: SymbolName[];
  operandTypeRef?: SymbolName;
  operandIsTypeof?: true;
  predicate: Predicate;
}

export const readConditionLayerTransformer = ({ condition }: { condition: Node }): ConditionReadout => {
  const binary = Node.isBinaryExpression(condition) ? condition : undefined;
  const left = binary?.getLeft();
  const right = binary?.getRight();
  const opKind = binary === undefined ? '' : binary.getOperatorToken().getKindName();
  const isLengthAccess = left !== undefined && Node.isPropertyAccessExpression(left) && left.getName() === 'length';
  // A `typeof` operand is unwrapped the SAME way a `.length` access is: `operandIsTypeof` is read off
  // the LEFT node before the unwrap, so it survives even though `operandNode` becomes what `typeof`
  // applies to, not the `typeof` expression itself.
  const typeOfExpr = left !== undefined && Node.isTypeOfExpression(left) ? left : undefined;
  const operandNode: Node =
    left === undefined
      ? condition
      : typeOfExpr === undefined
        ? isLengthAccess && Node.isPropertyAccessExpression(left)
          ? left.getExpression()
          : left
        : typeOfExpr.getExpression();
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
              : Node.isNullLiteral(right)
                ? representativeValueContract.parse(null)
                : undefined;
  const operandName = Node.isIdentifier(operandNode) ? symbolNameContract.parse(operandNode.getText()) : undefined;
  const operandIsTypeof = typeOfExpr === undefined ? undefined : true;

  // An object-member operand is read PAST the property access: the leftmost identifier is the root the
  // read starts from, the `.member` chain is what it reads off it, and the root param's declared
  // type-reference name is the join key the stub stitch attaches the branched literal through.
  const property = Node.isPropertyAccessExpression(operandNode)
    ? readPropertyPathLayerTransformer({ node: operandNode })
    : undefined;
  const rootNode = property?.root;
  const operandRootName = rootNode !== undefined && Node.isIdentifier(rootNode) ? symbolNameContract.parse(rootNode.getText()) : undefined;
  const rootParam = rootNode?.getSymbol()?.getDeclarations().find((declaration) => Node.isParameterDeclaration(declaration));
  const rootTypeNode = rootParam !== undefined && Node.isParameterDeclaration(rootParam) ? rootParam.getTypeNode() : undefined;
  const operandTypeRef =
    rootTypeNode !== undefined && Node.isTypeReference(rootTypeNode) ? symbolNameContract.parse(rootTypeNode.getTypeName().getText()) : undefined;

  return {
    operandNode,
    ...(operandName === undefined ? {} : { operandName }),
    ...(operandRootName === undefined ? {} : { operandRootName }),
    ...(property === undefined || property.path.length === 0 ? {} : { operandPropertyPath: property.path }),
    ...(operandTypeRef === undefined ? {} : { operandTypeRef }),
    ...(operandIsTypeof === undefined ? {} : { operandIsTypeof }),
    predicate: predicateTransformer({
      opKind,
      isLengthAccess,
      isTypeofAccess: typeOfExpr !== undefined,
      ...(rightLiteral === undefined ? {} : { rightLiteral }),
    }),
  };
};

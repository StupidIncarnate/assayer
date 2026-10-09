/**
 * PURPOSE: Rewrites the body of a syntax's `code` arrow for one specimen. Each identifier that names
 * one of the syntax's holes becomes the expression that fills that hole. Each `$arm('x')` statement
 * becomes the slot's arm statement (`return 'x';`, `console.log('x');` or `yield 'x';`), and each
 * `$arm('x')` expression becomes the string `'x'`. An identifier is a hole only when the nearest
 * function that declares a parameter of that name holds the very parameter the hole came from, so a
 * parameter of the same name in a nested function, and a property of the same name, are left alone.
 * Reach for this from the node renderer, after every hole has its fill.
 *
 * USAGE:
 * swapHolesLayerTransformer({ node: arrow.body, instance, fills, armKind: 'return' });
 * // Returns the body with `value` swapped for the fill of the hole `value`
 */
import ts from '#gateway/npm/typescript';

import type { SyntaxInstance } from '../../contracts/syntax-instance/syntax-instance-contract';

export const swapHolesLayerTransformer = ({
  node,
  instance,
  fills,
  armKind,
}: {
  node: ts.Node;
  instance: SyntaxInstance;
  fills: Map<string, ts.Expression>;
  armKind?: 'log' | 'return' | 'yield' | undefined;
}): ts.VisitResult<ts.Node | undefined> => {
  if (ts.isIdentifier(node)) {
    const isMemberName =
      (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) ||
      (ts.isPropertyAssignment(node.parent) && node.parent.name === node);
    const declaring = isMemberName
      ? undefined
      : ts.findAncestor(
          node,
          (ancestor): ancestor is ts.SignatureDeclaration =>
            ts.isFunctionLike(ancestor) &&
            ancestor.parameters.some((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === node.text),
        );
    const parameter = declaring?.parameters.find(
      (candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === node.text,
    );
    const hole = instance.holes.find((candidate) => candidate.symbol.valueDeclaration === parameter);
    const fill = hole === undefined ? undefined : fills.get(hole.name);
    if (parameter !== undefined && fill !== undefined) {
      return fill;
    }
  }

  const armCall = ts.isExpressionStatement(node) ? node.expression : node;
  if (ts.isCallExpression(armCall) && ts.isIdentifier(armCall.expression) && armCall.expression.text === '$arm') {
    const [first] = armCall.arguments;
    if (first === undefined || !ts.isStringLiteral(first)) {
      throw new Error(
        `The syntax '${instance.label}' has an $arm call without a string name. Write $arm('then'), for example.`,
      );
    }
    const arm = ts.factory.createStringLiteral(first.text, true);
    if (!ts.isExpressionStatement(node)) {
      return arm;
    }
    if (armKind === 'return') {
      return ts.factory.createReturnStatement(arm);
    }
    if (armKind === 'log') {
      return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('console'), 'log'),
          undefined,
          [arm],
        ),
      );
    }
    if (armKind === 'yield') {
      return ts.factory.createExpressionStatement(ts.factory.createYieldExpression(undefined, arm));
    }
    throw new Error(
      `The arm '${first.text}' of the syntax '${instance.label}' needs a statement slot, because it is written as a statement. Put this syntax in a slot that has an arm, or use an expression syntax.`,
    );
  }

  return ts.visitEachChild(
    node,
    (child) => swapHolesLayerTransformer({ node: child, instance, fills, armKind }),
    undefined,
  );
};

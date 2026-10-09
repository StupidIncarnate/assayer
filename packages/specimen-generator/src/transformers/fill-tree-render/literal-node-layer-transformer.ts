/**
 * PURPOSE: Builds the expression node that writes one known value: a number, a string, a boolean, or
 * an array of those. Strings use single quotes. A negative number becomes a minus sign in front of
 * the positive number, because a numeric literal node cannot hold a sign. Reach for this when a leaf
 * writes its value inline or into a `const`.
 *
 * USAGE:
 * literalNodeLayerTransformer({ value: [10, 20] });
 * // Returns the node for `[10, 20]`
 */
import ts from '#gateway/npm/typescript';

export const literalNodeLayerTransformer = ({ value }: { value: unknown }): ts.Expression => {
  if (typeof value === 'number') {
    return value < 0
      ? ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, ts.factory.createNumericLiteral(-value))
      : ts.factory.createNumericLiteral(value);
  }
  if (typeof value === 'string') {
    return ts.factory.createStringLiteral(value, true);
  }
  if (typeof value === 'boolean') {
    return value ? ts.factory.createTrue() : ts.factory.createFalse();
  }
  if (Array.isArray(value)) {
    return ts.factory.createArrayLiteralExpression(
      value.map((item: unknown) => literalNodeLayerTransformer({ value: item })),
    );
  }

  throw new Error(
    `The generator has no way to write ${JSON.stringify(value)} as code. A known value must be a number, a string, a boolean, or an array of those. Change the known value of this type in typeListStatics.`,
  );
};

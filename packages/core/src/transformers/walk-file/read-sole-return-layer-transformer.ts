/**
 * PURPOSE: Reads the one expression a function body returns. An arrow body that is an expression is that
 *   expression. A block body qualifies only when its whole content is a single `return`. Anything else
 *   (more statements, no return, no body) has no single returned expression.
 *
 * USAGE:
 * readSoleReturnLayerTransformer({ body: fn.getBody() });
 * // Returns the returned expression node, or undefined
 */
import { Node } from "#gateway/npm/ts-morph";
import type { Node as TsNode } from "#gateway/npm/ts-morph";

export const readSoleReturnLayerTransformer = ({
  body,
}: {
  body: TsNode | undefined;
}): TsNode | undefined => {
  if (body === undefined) {
    return undefined;
  }

  if (!Node.isBlock(body)) {
    return body;
  }

  const [only, ...rest] = body.getStatements();

  return rest.length === 0 && Node.isReturnStatement(only)
    ? only.getExpression()
    : undefined;
};

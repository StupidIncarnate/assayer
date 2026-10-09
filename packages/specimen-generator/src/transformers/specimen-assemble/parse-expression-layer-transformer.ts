/**
 * PURPOSE: Parses the text of one expression, as the focus renderer printed it, into a node that can
 * be placed inside a container. Reach for this when the focus is an expression, and for a focus that
 * a statement slot wraps in its arm.
 *
 * USAGE:
 * parseExpressionLayerTransformer({ text: 'value > 5' });
 * // Returns the node for `value > 5`
 */
import ts from '#gateway/npm/typescript';

import { synthesizeLayerTransformer } from './synthesize-layer-transformer';

export const parseExpressionLayerTransformer = ({ text }: { text: string }): ts.Expression => {
  const sourceFile = ts.createSourceFile('snippet.ts', `const snippet = ${text};`, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  const initializer =
    statement !== undefined && ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.initializer
      : undefined;

  if (initializer === undefined) {
    throw new Error(
      `The generator could not read '${text}' as one expression. The focus renderer must give one expression for an expression slot.`,
    );
  }

  return ts.visitNode(initializer, (child) => synthesizeLayerTransformer({ node: child }), ts.isExpression);
};

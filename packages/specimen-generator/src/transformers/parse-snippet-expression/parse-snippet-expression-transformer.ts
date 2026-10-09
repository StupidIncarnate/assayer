/**
 * PURPOSE: Parses the text of one expression into a node that can be placed inside other code. The
 * text comes from a place the generator does not build with nodes: a type's env or external read in
 * typeListStatics, or an expression the focus renderer just printed. It can rename one identifier,
 * for the `KEY` placeholder in an env read. Reach for this when a node is needed from such text.
 *
 * USAGE:
 * parseSnippetExpressionTransformer({ text: 'Number(process.env.KEY)', rename: { from: 'KEY', to: 'VALUE' } });
 * // Returns the node for `Number(process.env.VALUE)`
 */
import ts from '#gateway/npm/typescript';

import { synthesizeNodeTransformer } from '../synthesize-node/synthesize-node-transformer';

export const parseSnippetExpressionTransformer = ({
  text,
  rename,
}: {
  text: string;
  rename?: { from: string; to: string } | undefined;
}): ts.Expression => {
  const sourceFile = ts.createSourceFile('snippet.ts', `const snippet = ${text};`, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  const initializer =
    statement !== undefined && ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.initializer
      : undefined;

  if (initializer === undefined) {
    throw new Error(
      `The generator could not read '${text}' as one expression. Fix the text where it comes from: the env or external read of the type in typeListStatics, or the focus renderer's output.`,
    );
  }

  return ts.visitNode(initializer, (child) => synthesizeNodeTransformer({ node: child, rename }), ts.isExpression);
};

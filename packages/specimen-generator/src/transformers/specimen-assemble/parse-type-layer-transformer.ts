/**
 * PURPOSE: Parses the text of one type, such as `readonly number[]` or `Generator<string>`, into a
 * node that can be placed inside a container. A parameter's type and the entry's result type reach the
 * assembler as text. Reach for this when a type node is needed from text.
 *
 * USAGE:
 * parseTypeLayerTransformer({ text: 'readonly number[]' });
 * // Returns the node for `readonly number[]`
 */
import ts from '#gateway/npm/typescript';

import { synthesizeLayerTransformer } from './synthesize-layer-transformer';

export const parseTypeLayerTransformer = ({ text }: { text: string }): ts.TypeNode => {
  const sourceFile = ts.createSourceFile('snippet.ts', `let snippet: ${text};`, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  const type =
    statement !== undefined && ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.type
      : undefined;

  if (type === undefined) {
    throw new Error(
      `The generator could not read '${text}' as one type. Fix the parameter type or the result type given to the assembler.`,
    );
  }

  return ts.visitNode(type, (child) => synthesizeLayerTransformer({ node: child }), ts.isTypeNode);
};

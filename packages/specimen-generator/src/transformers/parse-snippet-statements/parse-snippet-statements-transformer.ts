/**
 * PURPOSE: Parses statement text, as the focus renderer printed it, into statement nodes that can be
 * placed inside a container. The text is parsed inside a wrapper function that allows `return`,
 * `await` and `yield`, so any statement an arm can write is accepted. Reach for this for a statement
 * focus and for each top-of-file declaration.
 *
 * USAGE:
 * parseSnippetStatementsTransformer({ text: "const value: number = 3;" });
 * // Returns the nodes for the one statement
 */
import ts from '#gateway/npm/typescript';

import { synthesizeNodeTransformer } from '../synthesize-node/synthesize-node-transformer';

export const parseSnippetStatementsTransformer = ({ text }: { text: string }): readonly ts.Statement[] => {
  const sourceFile = ts.createSourceFile(
    'snippet.ts',
    `async function* snippet() {\n${text}\n}`,
    ts.ScriptTarget.ES2022,
    true,
  );
  const [wrapper] = sourceFile.statements;
  const body = wrapper !== undefined && ts.isFunctionDeclaration(wrapper) ? wrapper.body : undefined;

  if (body === undefined) {
    throw new Error(
      `The generator could not read '${text}' as statements. The focus renderer must give valid statements for a statement slot.`,
    );
  }

  return ts.visitNode(body, (child) => synthesizeNodeTransformer({ node: child }), ts.isBlock).statements;
};

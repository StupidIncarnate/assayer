/**
 * PURPOSE: Writes the focus code of one specimen from its fill tree, and lists what that code needs
 * around it: the parameters the callable must take, and the declarations that go at the top of the
 * file, both in the order the code first uses them. Reach for this once the planner has a tree. The
 * assembler then places the text, the parameters and the declarations into a container. The text is
 * printed by the TypeScript printer, so its indentation is the printer's.
 *
 * USAGE:
 * fillTreeRenderTransformer({ tree, armKind: 'return' });
 * // Returns { text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';", params: [{ name: 'value', type: 'number' }], declarations: [] }
 */
import ts from '#gateway/npm/typescript';

import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import { renderNodeLayerTransformer } from './render-node-layer-transformer';

export const fillTreeRenderTransformer = ({
  tree,
  armKind,
}: {
  tree: FillTree;
  armKind?: 'log' | 'return' | 'yield';
}): {
  text: string;
  params: { name: string; type: string }[];
  declarations: { name: string; text: string }[];
} => {
  const names = new Map<FillTree, string>();
  const params = new Map<string, string>();
  const decls = new Map<string, string>();
  const body = renderNodeLayerTransformer({ tree, armKind, names, params, decls });
  const printer = ts.createPrinter({ removeComments: true });
  const sourceFile =
    tree.kind === 'node'
      ? tree.instance.syntax.sourceFile
      : ts.createSourceFile('focus.ts', '', ts.ScriptTarget.ES2022, false);

  return {
    text: ts.isBlock(body)
      ? body.statements.map((statement) => printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile)).join('\n')
      : printer.printNode(ts.EmitHint.Unspecified, body, sourceFile),
    params: [...params].map(([name, type]) => ({ name, type })),
    declarations: [...decls].map(([name, text]) => ({ name, text })),
  };
};

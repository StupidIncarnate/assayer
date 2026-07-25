/**
 * PURPOSE: Reads the NAME a module exports one function-like's declaration under, resolved through
 *   TypeScript's own module-export table — never off the `export` keyword the declaration happens to
 *   carry. That is the whole point: `const runIt = …; export default runIt;` and
 *   `export { runIt as default };` export exactly what `export default function runIt` does, and only
 *   the checker knows it, because the export statement is somewhere else in the file entirely.
 *
 *   Reading the keyword instead made a declaration exported through a later statement look private,
 *   so its entry vanished and the file's only surface was reported as dead the repo should delete —
 *   a build failing over ordinary correct code.
 *
 *   The name is the EXPORTED one, which is not always the local one: `export { runIt as go }` puts the
 *   function on the module under `go`, and a runner reaching for `runIt` finds nothing. Returning the
 *   name rather than a boolean is what lets access carry that through.
 *
 *   An anonymous `export default () => …` hangs off the export assignment itself and is not a
 *   declaration this can key on; its caller answers that shape directly.
 *
 * USAGE:
 * readModuleExportLayerAdapter({ node: arrowFunction });
 * // Returns 'default' for `const runIt = …; export default runIt`, 'runIt' for `export const runIt`,
 * // and undefined for a private helper
 */
import { Node } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

export const readModuleExportLayerAdapter = ({ node }: { node: Node }): SymbolName | undefined => {
  const parent = node.getParent();
  // The declaration the module would export: the variable a `const f = () => …` binds, or the
  // function declaration itself. Anything else is not a module-level binding.
  const declaration = Node.isVariableDeclaration(parent) ? parent : node;
  const moduleSymbol = node.getSourceFile().getSymbol();

  if (moduleSymbol === undefined) {
    return undefined;
  }

  // Each export symbol, followed through the alias an `export { x }` / `export default x` creates, to
  // the declaration it actually names. Comparing DECLARATIONS keeps one identity for the many symbol
  // wrappers a re-export chain produces.
  const [name] = moduleSymbol.getExports().flatMap((exported) => {
    const target = exported.getAliasedSymbol() ?? exported;

    return target.getDeclarations().some((declared) => declared === declaration)
      ? [symbolNameContract.parse(exported.getName())]
      : [];
  });

  return name;
};

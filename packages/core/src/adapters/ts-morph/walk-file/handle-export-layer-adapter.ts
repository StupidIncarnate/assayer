/**
 * PURPOSE: Handles an `export` declaration — records a module edge ONLY when it re-exports from
 *   another module (`export { x } from './y'`, `export * from './y'`). A plain `export { x }` with no
 *   `from` names nothing cross-file, so it contributes no edge. The edge is flat and file-level (never
 *   scope-claimed), carrying the specifier, the forwarded bindings, and the declaration's position.
 *
 *   `kind: 'reexport'` is what lets a later stitch pass follow re-export barrels to the definition
 *   site without re-parsing. Bindings are structural: a bare `export *` forwards everything (`star`),
 *   a named re-export carries its SOURCE name and, when renamed, the exported-as alias. It opens no
 *   scope and asks for no descents — a re-export forwards names, it does not branch.
 *
 * USAGE:
 * handleExportLayerAdapter({ node: exportDeclaration, context });
 * // Returns a HandlerResult with one moduleEdge (or none, for a local export list) and no descents
 */
import type { ExportDeclaration } from 'ts-morph';

import { moduleEdgeContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';

export const handleExportLayerAdapter = ({
  node,
}: {
  node: ExportDeclaration;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const moduleSpecifier = node.getModuleSpecifier();

  if (moduleSpecifier === undefined) {
    // A local `export { x }` / `export type { X }` with no `from` — nothing cross-file to record.
    return handlerResultLayerAdapter({ descents: [] });
  }

  const bindings = node.isNamespaceExport()
    ? [{ kind: 'star' }]
    : node.getNamedExports().map((specifier) => {
        const alias = specifier.getAliasNode();
        return alias === undefined
          ? { kind: 'named', name: specifier.getName() }
          : { kind: 'named', name: specifier.getName(), alias: alias.getText() };
      });

  const position = node.getSourceFile().getLineAndColumnAtPos(node.getStart());

  return handlerResultLayerAdapter({
    moduleEdges: [
      moduleEdgeContract.parse({
        kind: 'reexport',
        specifier: moduleSpecifier.getLiteralText(),
        bindings,
        line: position.line,
        column: position.column,
      }),
    ],
    descents: [],
  });
};

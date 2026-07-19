/**
 * PURPOSE: Handles an `import` declaration — records ONE module edge as a flat file-level fact (never
 *   scope-claimed, like a probe site) carrying the module specifier its source is named with, the
 *   bindings it pulls in, and the declaration's position. It opens no scope and asks for no descents:
 *   an import binds names, it does not branch, and nothing inside it is a scope the walk must reach.
 *
 *   The edge is the raw, unresolved half of the cross-file graph — a later stitch pass resolves the
 *   specifier to a definition site. Bindings are read structurally: a named import carries its SOURCE
 *   name and, when renamed, the local alias; `default`/`namespace` carry the local name. A bare
 *   `import './x'` side-effect import contributes an edge with no bindings.
 *
 * USAGE:
 * handleImportLayerAdapter({ node: importDeclaration, context });
 * // Returns a HandlerResult with one moduleEdge and no descents
 */
import type { ImportDeclaration } from 'ts-morph';

import { moduleEdgeContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';

export const handleImportLayerAdapter = ({
  node,
}: {
  node: ImportDeclaration;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const defaultImport = node.getDefaultImport();
  const namespaceImport = node.getNamespaceImport();
  const named = node.getNamedImports().map((specifier) => {
    const alias = specifier.getAliasNode();
    return alias === undefined
      ? { kind: 'named', name: specifier.getName() }
      : { kind: 'named', name: specifier.getName(), alias: alias.getText() };
  });

  const bindings = [
    ...(defaultImport === undefined ? [] : [{ kind: 'default', local: defaultImport.getText() }]),
    ...(namespaceImport === undefined ? [] : [{ kind: 'namespace', local: namespaceImport.getText() }]),
    ...named,
  ];

  const position = node.getSourceFile().getLineAndColumnAtPos(node.getStart());

  return handlerResultLayerAdapter({
    moduleEdges: [
      moduleEdgeContract.parse({
        kind: 'import',
        specifier: node.getModuleSpecifierValue(),
        bindings,
        line: position.line,
        column: position.column,
      }),
    ],
    descents: [],
  });
};

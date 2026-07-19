/**
 * PURPOSE: Handles a dynamic `import()` call — records ONE module edge, never a call. When the
 *   specifier argument is a string literal the edge is an ordinary `import` carrying that literal
 *   value: a dynamic import of a literal is a real, resolvable dependency, so it stitches exactly like
 *   a static import. When the argument is anything else — a variable, a call, a template — the source
 *   is not a literal, so the edge is `dynamic`: it carries no specifier and no bindings, and the later
 *   stitch pass hard-errors it as a computed specifier, demanding a static import the analyzer can
 *   drive.
 *
 *   It descends its children so a call or scope hiding in the argument (`import(pick())`) is still
 *   found (D22). It opens no scope and records no branch — a dynamic import binds names at runtime,
 *   it does not branch.
 *
 * USAGE:
 * handleDynamicImportLayerAdapter({ node: dynamicImportCall, context });
 * // Returns a HandlerResult with one moduleEdge and the argument's child descents
 */
import { Node } from 'ts-morph';
import type { CallExpression } from 'ts-morph';

import { moduleEdgeContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';

export const handleDynamicImportLayerAdapter = ({
  node,
  context,
}: {
  node: CallExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const position = node.getSourceFile().getLineAndColumnAtPos(node.getStart());
  const [firstArg] = node.getArguments();

  const edge =
    firstArg !== undefined && Node.isStringLiteral(firstArg)
      ? moduleEdgeContract.parse({
          kind: 'import',
          specifier: firstArg.getLiteralValue(),
          bindings: [],
          line: position.line,
          column: position.column,
        })
      : moduleEdgeContract.parse({
          kind: 'dynamic',
          bindings: [],
          line: position.line,
          column: position.column,
        });

  return handlerResultLayerAdapter({
    moduleEdges: [edge],
    descents: node.forEachChildAsArray().map((child) => ({ node: child, context })),
  });
};

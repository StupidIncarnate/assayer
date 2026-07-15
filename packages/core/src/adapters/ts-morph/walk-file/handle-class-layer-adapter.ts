/**
 * PURPOSE: Handles a class — a NAMING scope, not an executable one. A class owns no control flow of
 *   its own, so it opens no scope record; it contributes a path segment (`['Classifier', 'classify']`)
 *   and passes its export reach down to its members, which is what makes a method of an exported
 *   class an analysable entry while a bare nested function is not. Members are then just
 *   function-likes: the class rung costs this file and nothing else.
 *
 * USAGE:
 * handleClassLayerAdapter({ node: classDeclaration, context });
 * // Returns a HandlerResult descending the class's members under its name
 */
import { Node } from 'ts-morph';
import type { ClassDeclaration, ClassExpression } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';

export const handleClassLayerAdapter = ({
  node,
  context,
}: {
  node: ClassDeclaration | ClassExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const name = symbolNameContract.parse(node.getName() ?? 'default');
  const exported = Node.isClassDeclaration(node) ? node.isExported() : context.exported;
  const scoped = walkContextTransformer({ context, scopeSegment: name, params: [], exported });

  return handlerResultLayerAdapter({
    nodes: [
      walkNodeContract.parse({
        kind: node.getKindName(),
        scopePath: scoped.scopePath,
        name,
        startLine: node.getStartLineNumber(),
        endLine: node.getEndLineNumber(),
        handled: true,
      }),
    ],
    descents: node.getMembers().map((member) => ({ node: member, context: scoped })),
  });
};

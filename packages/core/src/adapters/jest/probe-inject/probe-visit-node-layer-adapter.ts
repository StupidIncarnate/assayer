/**
 * PURPOSE: THE injection recursion — visits one node, then calls ITSELF on each child, wrapping any
 *   node whose range matches a probe site. Children are visited FIRST so a nested site (a leaf inside
 *   a condition inside a returned expression) is wrapped before its parent is.
 *
 *   The range lookup reads the ORIGINAL node, never the visited one: a rewritten node is synthetic
 *   and has no position in the source at all. This is why the plan is content-hash keyed — offsets
 *   only mean anything against the exact bytes they were computed from.
 *
 * USAGE:
 * probeVisitNodeLayerAdapter({ ts, context, sourceFile, sites, node });
 * // Returns the node, with `score > 5` rewritten to `__P.c('…#leaf.0', score > 5)`
 */
import type TS from 'typescript';

import type { ProbeSite } from '../../../contracts/probe-site/probe-site-contract';

export const probeVisitNodeLayerAdapter = ({
  ts,
  context,
  sourceFile,
  sites,
  node,
}: {
  ts: typeof TS;
  context: TS.TransformationContext;
  sourceFile: TS.SourceFile;
  sites: ProbeSite[];
  node: TS.Node;
}): TS.Node => {
  const start = node.getStart(sourceFile);
  const end = node.getEnd();

  const visited = ts.visitEachChild(
    node,
    (child) => probeVisitNodeLayerAdapter({ ts, context, sourceFile, sites, node: child }),
    context,
  );

  const site = sites.find((candidate) => candidate.start === start && candidate.end === end);

  if (site === undefined || !ts.isExpression(visited)) {
    return visited;
  }

  // Wrapping IN PLACE is what preserves short-circuit: the probe call sits exactly where the
  // expression sat, so an operand the language skips never calls it.
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('__P'), site.kind === 'cond' ? 'c' : 'x'),
    undefined,
    [ts.factory.createStringLiteral(site.id), visited],
  );
};

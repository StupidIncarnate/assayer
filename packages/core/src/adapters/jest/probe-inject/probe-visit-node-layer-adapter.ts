/**
 * PURPOSE: THE injection recursion — visits one node, then calls ITSELF on each child, observing any
 *   node whose range matches a probe site. Children are visited FIRST so a nested site (a leaf inside
 *   a condition inside a returned expression) is observed before its parent is.
 *
 *   Three shapes of observation, because three shapes of thing are observed. An expression site is
 *   WRAPPED in place, which is what preserves short-circuit: the probe sits exactly where the
 *   expression sat, so an operand the language skips never calls it. A `complete` site is a statement
 *   container, and the probe is APPENDED to it — falling off the end of an arm is an event with no
 *   expression and no syntax to wrap, so the only place to observe it is the position it happens at.
 *   An arm that is a bare statement becomes a block to hold the probe, which changes nothing about it:
 *   an if-arm may be either, and a block introduces no scope a `let` in it could escape from anyway.
 *   An `optional` site is a single-level `a?.b` REWRITTEN into a runtime call: its two paths — the
 *   member value when the receiver is non-null, `undefined` when it is nullish — cannot both be
 *   wrapped in place because the nullish path has no expression, so one call observes both.
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

  if (site === undefined) {
    return visited;
  }

  // `a?.b` observed from ONE span. Its receiver-nullish path short-circuits to `undefined` with no
  // expression to wrap, so it cannot be a plain in-place wrap: the whole access is rewritten to
  // `__P.oc(thenId, elseId, a, (r) => r.b)`. The receiver is passed once and the member read only in
  // the accessor, so `oc` reads `a.b` exactly when `a?.b` would and fires the ELSE exit otherwise —
  // both exits become observable from this single site.
  if (site.kind === 'optional') {
    return ts.isPropertyAccessExpression(visited) && site.elseId !== undefined
      ? ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('__P'), 'oc'),
          undefined,
          [
            ts.factory.createStringLiteral(site.id),
            ts.factory.createStringLiteral(site.elseId),
            visited.expression,
            ts.factory.createArrowFunction(
              undefined,
              undefined,
              [ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier('r'))],
              undefined,
              ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('r'), visited.name.text),
            ),
          ],
        )
      : visited;
  }

  const probe = ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('__P'), site.kind === 'cond' ? 'c' : 'x'),
    undefined,
    // A completion has no value to carry, so the probe reports `undefined` — the event IS the fact.
    site.kind === 'complete'
      ? [ts.factory.createStringLiteral(site.id), ts.factory.createIdentifier('undefined')]
      : [ts.factory.createStringLiteral(site.id), visited as TS.Expression],
  );

  if (site.kind === 'complete') {
    const statement = ts.factory.createExpressionStatement(probe);

    if (ts.isBlock(visited)) {
      return ts.factory.updateBlock(visited, [...visited.statements, statement]);
    }

    return ts.isStatement(visited) ? ts.factory.createBlock([visited, statement], true) : visited;
  }

  // Wrapping IN PLACE is what preserves short-circuit: the probe call sits exactly where the
  // expression sat, so an operand the language skips never calls it.
  return ts.isExpression(visited) ? probe : visited;
};

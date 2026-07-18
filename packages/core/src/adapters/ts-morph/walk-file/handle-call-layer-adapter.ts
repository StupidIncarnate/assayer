/**
 * PURPOSE: Handles a call expression — records ONE call edge as a loose fact (claimed by the
 *   enclosing scope, exactly like a branch or an exit) and descends every child so nested scopes,
 *   branches, and calls hiding in the callee expression or the arguments are still found (D22).
 *
 *   The edge is a LINK, never a copy: `read-callee` resolves WHAT is called (a same-file scope, or
 *   `unresolved`), `read-call-args` projects HOW each argument is passed (a caller param straight
 *   through, a fixed literal, or opaque), and `guardPath` is the call's reachability read straight off
 *   the context — empty when the call always runs. Together these are what lets a follower drive a
 *   private callee through a caller that reaches it and passes its own input straight in.
 *
 * USAGE:
 * handleCallLayerAdapter({ node: callExpression, context });
 * // Returns a HandlerResult with one call and the child descents
 */
import type { CallExpression } from 'ts-morph';

import { callSiteContract } from '../../../contracts/call-site/call-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readCallArgsLayerAdapter } from './read-call-args-layer-adapter';
import { readCalleeLayerAdapter } from './read-callee-layer-adapter';

export const handleCallLayerAdapter = ({
  node,
  context,
}: {
  node: CallExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> =>
  handlerResultLayerAdapter({
    calls: [
      callSiteContract.parse({
        callee: readCalleeLayerAdapter({ callee: node.getExpression() }),
        args: readCallArgsLayerAdapter({ args: node.getArguments() }),
        guardPath: context.guardPath,
      }),
    ],
    descents: node.forEachChildAsArray().map((child) => ({ node: child, context })),
  });

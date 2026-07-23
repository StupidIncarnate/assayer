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
import { Node } from 'ts-morph';
import type { CallExpression } from 'ts-morph';

import { globalUseContract, lineNumberContract, symbolNameContract } from '@assayer/shared/contracts';

import { callSiteContract } from '../../../contracts/call-site/call-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAmbientRootLayerAdapter } from './read-ambient-root-layer-adapter';
import { readCallArgsLayerAdapter } from './read-call-args-layer-adapter';
import { readCalleeLayerAdapter } from './read-callee-layer-adapter';

export const handleCallLayerAdapter = ({
  node,
  context,
}: {
  node: CallExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const position = node.getSourceFile().getLineAndColumnAtPos(node.getStart());
  const callee = node.getExpression();
  const args = readCallArgsLayerAdapter({ args: node.getArguments() });

  // A `receiver.method(...)` call on a plain-identifier receiver records both names — the identifier's
  // text IS its name (§5.1), no formatting freedom. It is what lets a follower see a callback argument
  // iterate one of the entry's array params (`items.map((n) => …)`); a bare or computed callee leaves
  // both unset.
  const receiverExpr = Node.isPropertyAccessExpression(callee) ? callee.getExpression() : undefined;
  const memberInfo =
    receiverExpr !== undefined && Node.isPropertyAccessExpression(callee) && Node.isIdentifier(receiverExpr)
      ? { receiver: symbolNameContract.parse(receiverExpr.getText()), method: symbolNameContract.parse(callee.getName()) }
      : {};

  // An immediately-invoked inline function — `((n) => …)(x)` — REACHES that function. Unwrap the
  // callee's parens; if it is a function-like, record its start line so a follower never mistakes it for
  // dead surface. Its parameter is welded to the invocation's arguments, so it still stays undriven.
  const invokedInline = Node.isParenthesizedExpression(callee) ? callee.getExpression() : callee;
  const reachedFns =
    Node.isArrowFunction(invokedInline) || Node.isFunctionExpression(invokedInline)
      ? [lineNumberContract.parse(invokedInline.getStartLineNumber())]
      : [];

  // A bare-identifier call into an ambient-external global (`setTimeout(fn, 0)`) records a GLOBAL use
  // — a call whose callee is a `.member` access is instead recorded by the member-access handler on
  // the way down, so this only fires for the leftmost bare identifier and never double-counts.
  const globalUses =
    Node.isIdentifier(callee) && readAmbientRootLayerAdapter({ node: callee })
      ? [globalUseContract.parse({ name: callee.getText(), called: true, args, line: position.line, column: position.column })]
      : [];

  return handlerResultLayerAdapter({
    calls: [
      callSiteContract.parse({
        callee: readCalleeLayerAdapter({ callee }),
        args,
        guardPath: context.guardPath,
        position: { line: position.line, column: position.column },
        ...memberInfo,
      }),
    ],
    globalUses,
    reachedFns,
    descents: node.forEachChildAsArray().map((child) => ({ node: child, context })),
  });
};

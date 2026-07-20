/**
 * PURPOSE: Handles a `return` or `throw` — the scope's explicit exits. Its whole body is reading the
 *   guard path straight off the context, and that is the point: the old analyzer reconstructed this
 *   by climbing ancestors from each return, which only ever understood `if` and silently attributed
 *   a return inside a nested callback to the enclosing entry. Here the guard is simply what the walk
 *   carried down, so a return nested in an `if` inside a `switch` case inside another `if` is
 *   guarded correctly by construction, and one inside a callback belongs to the callback's scope
 *   because the walk opened one.
 *
 *   It DOES descend the returned expression, even though the exit is what a derived case drives
 *   toward and the value it carries is never the assertion (P4). The expression is not analysed for
 *   its value — it is descended because things worth finding hide in it: `return xs.map((n) => …)`
 *   contains a whole scope. When that expression IS a ternary it hands off to
 *   `read-conditional-exit`, which OWNS the exit: it retracts this handler's single unguarded exit and
 *   emits one guarded exit per arm instead. Any other expression keeps the single-exit path verbatim.
 *
 * USAGE:
 * handleExitLayerAdapter({ node: returnStatement, context });
 * // Returns a HandlerResult with one exit carrying the guard path that reached it
 */
import { Node } from 'ts-morph';
import type { ReturnStatement, ThrowStatement } from 'ts-morph';

import { exitNodeContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../../../contracts/probe-site/probe-site-contract';
import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { exitCoverageIdTransformer } from '../../../transformers/exit-coverage-id/exit-coverage-id-transformer';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readConditionalExitLayerAdapter } from './read-conditional-exit-layer-adapter';

export const handleExitLayerAdapter = ({
  node,
  context,
}: {
  node: ReturnStatement | ThrowStatement;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const kind = Node.isThrowStatement(node) ? 'throw' : 'return';
  const expression = node.getExpression();

  // A ternary in the returned/thrown position is two guarded exits, so `read-conditional-exit` owns
  // the split. Only when it is NOT a ternary does the single unguarded exit below stand.
  if (expression !== undefined) {
    const conditional = readConditionalExitLayerAdapter({ expression, kind, context });
    if (conditional.conditional) {
      return conditional.result;
    }
  }

  const coverageId = exitCoverageIdTransformer({ kind, guardPath: context.guardPath, scopePath: context.scopePath });

  return handlerResultLayerAdapter({
    exits: [
      exitNodeContract.parse({
        coverageId,
        kind,
        guardPath: context.guardPath,
        line: node.getStartLineNumber(),
      }),
    ],
    // The probe wraps the returned EXPRESSION, so the exit's runtime observation carries the value
    // that flowed out — display-only (P4 forbids asserting it), and the reason a bare `return;` gets
    // no site: there is no expression to wrap.
    probeSites:
      expression === undefined
        ? []
        : [probeSiteContract.parse({ id: coverageId, kind: 'exit', start: expression.getStart(), end: expression.getEnd() })],
    descents: expression === undefined ? [] : [{ node: expression, context }],
  });
};

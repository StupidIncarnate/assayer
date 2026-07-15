/**
 * PURPOSE: Handles a statement LIST — the one place sequential flow is modelled. Two facts about a
 *   statement depend on its siblings rather than its parents, and neither is expressible by
 *   descending alone:
 *
 *   - EARLY RETURN. Code after an `if` whose then-arm always exits is reachable only when that `if`
 *     was false, so it inherits `{thatIf, else}`. This is why `return 'small'` after
 *     `if (x) { return 'big'; }` is guarded rather than unconditional. The old analyzer had this
 *     rule too, but only at a function's TOP level — nested blocks silently lost it. Here every
 *     block gets it, at any depth, because every block comes through this handler.
 *   - TAIL POSITION. Only the LAST statement can end the scope; everything before it has code after
 *     it by definition.
 *
 *   It derives an earlier `if`'s coverage ID from that `if` itself rather than waiting for it to be
 *   walked — a sequential dependency the descent model cannot express — which is why that derivation
 *   lives in its own unit both handlers share.
 *
 * USAGE:
 * handleBlockLayerAdapter({ statements, context });
 * // Returns a HandlerResult descending each statement with its own guard and tail flag
 */
import { Node } from 'ts-morph';
import type { Statement } from 'ts-morph';

import { guardStepContract } from '@assayer/shared/contracts';
import type { GuardStep } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkContextTransformer } from '../../../transformers/walk-context/walk-context-transformer';
import { deriveBranchIdLayerAdapter } from './derive-branch-id-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readTerminalLayerAdapter } from './read-terminal-layer-adapter';

export const handleBlockLayerAdapter = ({
  statements,
  context,
}: {
  statements: Statement[];
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> =>
  handlerResultLayerAdapter({
    descents: statements.map((statement, index) => {
      const negations = statements.slice(0, index).flatMap<GuardStep>((earlier) => {
        if (!Node.isIfStatement(earlier)) {
          return [];
        }
        const elseStatement = earlier.getElseStatement();
        const thenExits = readTerminalLayerAdapter({ node: earlier.getThenStatement() });
        const elseExits = elseStatement !== undefined && readTerminalLayerAdapter({ node: elseStatement });

        // Exactly one arm escaping is what makes the survivor's guard knowable. If both escape,
        // nothing here is reachable at all; if neither does, this statement is not guarded by it.
        if (thenExits === elseExits) {
          return [];
        }
        const branchCoverageId = deriveBranchIdLayerAdapter({ node: earlier, scopePath: context.scopePath });
        return [guardStepContract.parse({ branchCoverageId, arm: thenExits ? 'else' : 'then' })];
      });

      return {
        node: statement,
        context: walkContextTransformer({
          context,
          guardSteps: negations,
          tail: context.tail && index === statements.length - 1,
        }),
      };
    }),
  });

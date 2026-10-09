/**
 * PURPOSE: Turns the rendered focus into the statements that replace a statement slot's marker. A
 * statement focus is parsed as it is. An expression focus is wrapped in the slot's arm: `return x;`,
 * `console.log(x);` or `yield x;`. Reach for this from specimenAssembleTransformer, for a statement
 * slot only.
 *
 * USAGE:
 * focusStatementsLayerTransformer({ container, slot, text: 'value > 5', focusKind: 'expression' });
 * // Returns the node for `return value > 5;` when the slot's arm is 'return'
 */
import ts from '#gateway/npm/typescript';

import type { ContainerSlot } from '../../contracts/container-slot/container-slot-contract';
import type { LoadedContainer } from '../../contracts/loaded-container/loaded-container-contract';
import { parseSnippetExpressionTransformer } from '../parse-snippet-expression/parse-snippet-expression-transformer';
import { parseSnippetStatementsTransformer } from '../parse-snippet-statements/parse-snippet-statements-transformer';

export const focusStatementsLayerTransformer = ({
  container,
  slot,
  text,
  focusKind,
}: {
  container: LoadedContainer;
  slot: ContainerSlot;
  text: string;
  focusKind: 'expression' | 'statement';
}): readonly ts.Statement[] => {
  if (focusKind === 'statement') {
    return parseSnippetStatementsTransformer({ text });
  }

  const expression = parseSnippetExpressionTransformer({ text });
  if (slot.arm === 'return') {
    return [ts.factory.createReturnStatement(expression)];
  }
  if (slot.arm === 'log') {
    return [
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('console'), 'log'),
          undefined,
          [expression],
        ),
      ),
    ];
  }
  if (slot.arm === 'yield') {
    return [ts.factory.createExpressionStatement(ts.factory.createYieldExpression(undefined, expression))];
  }

  throw new Error(
    `The slot '${slot.name}' of the container '${container.name}' has no arm, so an expression focus cannot be wrapped into a statement. Add arm to the slot, or plan the focus for an expression slot.`,
  );
};

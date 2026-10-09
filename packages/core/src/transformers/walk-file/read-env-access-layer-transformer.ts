/**
 * PURPOSE: Reads whether one expression IS a read of the process environment, `process.env.NAME` or
 *   `process.env['NAME']` with a literal key, and answers the variable's name with no steps yet. It is
 *   the bottom of every chain `read-env-chain` reads; that reader adds the steps applied on top.
 *
 *   `process` must be the runtime global. The analyzer's parse loads no Node types, so the global
 *   `process` resolves to no declaration at all. A file that writes its own `const process = …` gives
 *   the checker a declaration in THIS file, and the reader declines rather than setting a real
 *   environment variable the code never reads. The key is read through `getLiteralValue()`, so quote
 *   style never matters.
 *
 * USAGE:
 * readEnvAccessLayerTransformer({ node: propertyAccess });
 * // Returns { name: 'MODE', steps: [] } for `process.env.MODE`, or undefined
 */
import { Node } from '#gateway/npm/ts-morph';

import { envOperandReadoutContract } from '../../contracts/env-operand-readout/env-operand-readout-contract';
import type { EnvOperandReadout } from '../../contracts/env-operand-readout/env-operand-readout-contract';
import { envSourceStatics } from '../../statics/env-source/env-source-statics';
import { readLiteralValueLayerTransformer } from './read-literal-value-layer-transformer';

export const readEnvAccessLayerTransformer = ({ node }: { node: Node }): EnvOperandReadout | undefined => {
  if (!Node.isPropertyAccessExpression(node) && !Node.isElementAccessExpression(node)) {
    return undefined;
  }

  const container = node.getExpression();
  const keyNode = Node.isElementAccessExpression(node) ? node.getArgumentExpression() : undefined;
  const key = Node.isPropertyAccessExpression(node)
    ? node.getName()
    : keyNode === undefined
      ? undefined
      : readLiteralValueLayerTransformer({ node: keyNode });

  if (
    typeof key !== 'string' ||
    key.length === 0 ||
    !Node.isPropertyAccessExpression(container) ||
    container.getName() !== envSourceStatics.property
  ) {
    return undefined;
  }

  const root = container.getExpression();

  if (
    !Node.isIdentifier(root) ||
    root.getText() !== envSourceStatics.global ||
    (root.getSymbol()?.getDeclarations() ?? []).some((declared) => declared.getSourceFile() === root.getSourceFile())
  ) {
    return undefined;
  }

  return envOperandReadoutContract.parse({ name: key, steps: [] });
};

/**
 * PURPOSE: Reads whether one expression IS a read of the command line, and answers which entries it
 *   reads, with no steps yet. It is the argv bottom of every chain `read-env-chain` reads, the sibling
 *   of `read-env-access` for `process.env`.
 *
 *   It reads two shapes, each with a literal index read through `getLiteralValue()`:
 *   - `process.argv[<index>]` is one entry, shape `element`.
 *   - `process.argv.slice(<index>)` is every entry from `index` on, shape `tail`.
 *
 *   `process` must be the runtime global, proved exactly as `read-env-access` proves it: the analyzer's
 *   parse loads no Node types, so the global resolves to no declaration, and a file that declares its
 *   own `process` makes the reader decline.
 *
 * USAGE:
 * readArgvAccessLayerTransformer({ node: elementAccess });
 * // Returns { kind: 'argv', shape: 'element', index: 2 } for `process.argv[2]`, or undefined
 */
import { Node } from '#gateway/npm/ts-morph';

import { externalOperandReadoutContract } from '../../contracts/external-operand-readout/external-operand-readout-contract';
import type { ExternalOperandReadout } from '../../contracts/external-operand-readout/external-operand-readout-contract';
import { envSourceStatics } from '../../statics/env-source/env-source-statics';
import { readLiteralValueLayerTransformer } from './read-literal-value-layer-transformer';

export const readArgvAccessLayerTransformer = ({ node }: { node: Node }): ExternalOperandReadout['root'] | undefined => {
  const elementAccess = Node.isElementAccessExpression(node) ? node : undefined;
  const sliceCall =
    Node.isCallExpression(node) &&
    Node.isPropertyAccessExpression(node.getExpression()) &&
    node.getArguments().length === 1
      ? node
      : undefined;
  const sliceCallee = sliceCall?.getExpression();
  const isSlice =
    sliceCallee !== undefined && Node.isPropertyAccessExpression(sliceCallee) && sliceCallee.getName() === envSourceStatics.argv.slice;

  const container = elementAccess?.getExpression() ?? (isSlice && Node.isPropertyAccessExpression(sliceCallee) ? sliceCallee.getExpression() : undefined);
  const indexNode = elementAccess?.getArgumentExpression() ?? (isSlice ? sliceCall?.getArguments()[0] : undefined);
  const index = indexNode === undefined ? undefined : readLiteralValueLayerTransformer({ node: indexNode });

  if (
    container === undefined ||
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    !Node.isPropertyAccessExpression(container) ||
    container.getName() !== envSourceStatics.argv.property
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

  return externalOperandReadoutContract.shape.root.parse({
    kind: 'argv',
    shape: elementAccess === undefined ? 'tail' : 'element',
    index,
  });
};

/**
 * PURPOSE: Reads whether a branch operand holds a value read from the command line, and answers the
 *   read plus the pure steps on top of it, or nothing at all. `read-env-operand` is the sibling for an
 *   environment read. Both read through `read-env-chain`, so a command-line chain is read with the
 *   same shapes, written in place or held by a same-file `const`.
 *
 *   No case can set argv, so this read never makes a branch drivable. It records the one fact
 *   `leaf-default-value` needs to run the operand forward: which entries of argv it reads.
 *
 * USAGE:
 * readArgvOperandLayerTransformer({ node: readout.operandNode });
 * // Returns { shape: 'element', index: 2, steps: [{ kind: 'number' }] } for `Number(process.argv[2])`,
 * //   or undefined
 */
import type { Node } from '#gateway/npm/ts-morph';

import { argvReadContract } from '@assayer/shared/contracts';
import type { ArgvRead } from '@assayer/shared/contracts';

import { readEnvChainLayerTransformer } from './read-env-chain-layer-transformer';

export const readArgvOperandLayerTransformer = ({ node }: { node: Node }): ArgvRead | undefined => {
  const chain = readEnvChainLayerTransformer({ node, seen: [] });

  return chain?.root.kind === 'argv'
    ? argvReadContract.parse({ shape: chain.root.shape, index: chain.root.index, steps: chain.steps })
    : undefined;
};

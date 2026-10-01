/**
 * PURPOSE: Derives an `if`'s branch coverage ID from its scope path and the STRUCTURAL projection of
 *   its condition. It exists because two handlers need the same ID independently: the `if` handler
 *   when it emits the branch, and the block handler when it guards a later sibling by that `if`'s
 *   else. Deriving it twice from the same pure inputs is what lets the block handler know an
 *   earlier `if`'s identity WITHOUT waiting for that `if` to be walked — a sequential dependency the
 *   descent model could not otherwise express.
 *
 * USAGE:
 * deriveBranchIdLayerTransformer({ node: ifStatement, scopePath: ['Classifier', 'classify'] });
 * // Returns 'Classifier/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5'
 */
import type { IfStatement } from '#gateway/npm/ts-morph';

import type { SymbolName, Coverage } from '@assayer/shared/contracts';

import { coverageIdTransformer } from '../coverage-id/coverage-id-transformer';
import { projectNodeLayerTransformer } from './project-node-layer-transformer';

export const deriveBranchIdLayerTransformer = ({
  node,
  scopePath,
}: {
  node: IfStatement;
  scopePath: SymbolName[];
}): Coverage['id'] =>
  coverageIdTransformer({
    scopePath,
    segment: `if:${projectNodeLayerTransformer({ node: node.getExpression() })}`,
  });

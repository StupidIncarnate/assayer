/**
 * PURPOSE: Derives an `if`'s branch coverage ID from its scope path and the STRUCTURAL projection of
 *   its condition. It exists because two handlers need the same ID independently: the `if` handler
 *   when it emits the branch, and the block handler when it guards a later sibling by that `if`'s
 *   else. Deriving it twice from the same pure inputs is what lets the block handler know an
 *   earlier `if`'s identity WITHOUT waiting for that `if` to be walked — a sequential dependency the
 *   descent model could not otherwise express.
 *
 * USAGE:
 * deriveBranchIdLayerAdapter({ node: ifStatement, scopePath: ['Classifier', 'classify'] });
 * // Returns 'Classifier/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5'
 */
import type { IfStatement } from 'ts-morph';

import type { CoverageId, SymbolName } from '@assayer/shared/contracts';

import { coverageIdTransformer } from '../../../transformers/coverage-id/coverage-id-transformer';
import { projectNodeLayerAdapter } from './project-node-layer-adapter';

export const deriveBranchIdLayerAdapter = ({
  node,
  scopePath,
}: {
  node: IfStatement;
  scopePath: SymbolName[];
}): CoverageId =>
  coverageIdTransformer({
    scopePath,
    segment: `if:${projectNodeLayerAdapter({ node: node.getExpression() })}`,
  });

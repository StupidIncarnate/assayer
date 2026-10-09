/**
 * PURPOSE: THE recursion. Dispatches one node, then settles the handler's answer, which calls back
 *   into this file once per descent the handler asked for. Handlers never recurse: they describe their
 *   children and the context to hand them, and this owns the descent. That inversion is what makes
 *   constructs compose: a `switch` inside an `if` is guarded correctly because the walk already carried
 *   the `if`'s guard down, so neither handler knows the other exists.
 *
 *   How a handler's answer becomes walk facts, and how a scope claims its own loose facts on the way
 *   back up, lives in `settle-handler`.
 *
 * USAGE:
 * walkNodeLayerTransformer({ node: sourceFile, context });
 * // Returns { scopes, looseBranches, looseExits, nodes } for the whole subtree
 */
import type { Node } from '#gateway/npm/ts-morph';

import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import type { WalkFacts } from '../../contracts/walk-facts/walk-facts-contract';
import { dispatchNodeLayerTransformer } from './dispatch-node-layer-transformer';
import { settleHandlerLayerTransformer } from './settle-handler-layer-transformer';

export const walkNodeLayerTransformer = ({ node, context }: { node: Node; context: WalkContext }): WalkFacts =>
  settleHandlerLayerTransformer({ handled: dispatchNodeLayerTransformer({ node, context }), walk: walkNodeLayerTransformer });

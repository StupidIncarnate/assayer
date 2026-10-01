/**
 * PURPOSE: One descent a walk handler asks the core to take: the ts-morph node to walk next, and the
 *   walk context to carry down into it. A handler returns descents instead of recursing, so the core
 *   keeps ownership of traversal. The node is a live ts-morph object, which Zod cannot check, so this
 *   file holds a type and no schema.
 *
 * USAGE:
 * const descent: Descent = { node: ifStatement.getThenStatement(), context };
 * // Handed back inside a HandlerResult's `descents`
 */
import type { Node } from '#gateway/npm/ts-morph';

import type { WalkContext } from '../walk-context/walk-context-contract';

export interface Descent {
  node: Node;
  context: WalkContext;
}

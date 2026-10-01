/**
 * PURPOSE: What `readValueFlowExitLayerTransformer` hands back: whether the block ends in the
 *   `const x = <conditional>; return x` tail, the split's handler result, and the two statements the
 *   block handler drops from its own descent. The statements are live ts-morph nodes, which Zod
 *   cannot check, so this file holds a type and no schema.
 *
 * USAGE:
 * const readout: ValueFlowExitReadout = readValueFlowExitLayerTransformer({ statements, context });
 * // Returns { matched: true, result, consumed: [decl, exit] } when the tail pattern holds
 */
import type { Statement } from '#gateway/npm/ts-morph';

import type { HandlerResult } from '../handler-result/handler-result-contract';

export interface ValueFlowExitReadout {
  matched: boolean;
  result: HandlerResult;
  consumed: Statement[];
}

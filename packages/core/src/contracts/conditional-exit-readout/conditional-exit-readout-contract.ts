/**
 * PURPOSE: What `readConditionalExitLayerTransformer` hands back: whether the exit expression was
 *   conditional, and the split's handler result. `result` is present on both outcomes, empty when
 *   `conditional` is false, so a caller reads its fields without narrowing. The result carries live
 *   ts-morph nodes in its descents, which Zod cannot check, so this file holds a type and no schema.
 *
 * USAGE:
 * const readout: ConditionalExitReadout = readConditionalExitLayerTransformer({ expression, kind: 'return', context });
 * // Returns { conditional: true, result } for a ternary or short-circuit chain
 */
import type { HandlerResult } from '../handler-result/handler-result-contract';

export interface ConditionalExitReadout {
  conditional: boolean;
  result: HandlerResult;
}

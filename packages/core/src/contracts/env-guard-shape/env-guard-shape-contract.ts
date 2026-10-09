/**
 * PURPOSE: The two halves of an `x === undefined ? undefined : <chain>` ternary that
 *   `readEnvGuardLayerTransformer` picks out: the expression compared with `undefined`, and the arm
 *   that runs when it is defined. `read-env-chain` then reads both as environment chains. Both are live
 *   ts-morph nodes, which Zod cannot check, so this file holds a type and no schema.
 *
 * USAGE:
 * const shape: EnvGuardShape = readEnvGuardLayerTransformer({ node });
 * // Returns { tested, setArm } for `process.env.V === undefined ? undefined : Number(process.env.V)`
 */
import type { Node } from '#gateway/npm/ts-morph';

export interface EnvGuardShape {
  tested: Node;
  setArm: Node;
}

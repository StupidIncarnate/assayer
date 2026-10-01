/**
 * PURPOSE: A property-access operand split into its ROOT node and the `.member` chain read off it,
 *   left to right. `readPropertyPathLayerTransformer` returns this. The root is a live ts-morph node,
 *   which Zod cannot check, so this file holds a type and no schema.
 *
 * USAGE:
 * const readout: PropertyPathReadout = readPropertyPathLayerTransformer({ node });
 * // Returns { root, path: ['mode'] } for `config.mode`
 */
import type { Node } from '#gateway/npm/ts-morph';

export interface PropertyPathReadout {
  root: Node;
  path: string[];
}

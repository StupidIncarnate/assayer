/**
 * PURPOSE: Contract for a map node — a single branch-construct entry in the type-graph map
 *   (function, if, switch, ternary), spanning a line range with optional name and plugin metadata.
 *
 * USAGE:
 * mapNodeContract.parse({ kind: 'function', startLine: 1, endLine: 5 });
 * // Returns a validated MapNode (branded fields)
 */
import { z } from 'zod';

import { mapNodeKindContract } from '../map-node-kind/map-node-kind-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const mapNodeContract = z.object({
  kind: mapNodeKindContract,
  name: z.string().min(1).brand<'SymbolName'>().optional(),
  startLine: lineNumberContract,
  endLine: lineNumberContract,
  meta: z.record(z.string(), z.unknown()).brand<'PluginMetaBag'>().optional(),
});

export type MapNode = z.infer<typeof mapNodeContract>;

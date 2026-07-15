/**
 * PURPOSE: Contract for a walk node — the normalized, serializable record of ONE semantically
 *   load-bearing AST node the walk dispatched on: its kind, the scope path that owns it, its line
 *   span, an optional declared name, and whether a handler claimed it. This is the structural layer
 *   of the walk's output, distinct from the analysis layer (scopes/branches/exits): the map
 *   projection reads kinds and spans off it, and every node with `handled: false` projects to a
 *   dark spot. Only nodes that are HANDLED or SIGNIFICANT are recorded — an `Identifier` is neither,
 *   so the record stays bounded rather than mirroring every token in the file.
 *
 * USAGE:
 * walkNodeContract.parse({
 *   kind: 'IfStatement', scopePath: ['classify'], startLine: 2, endLine: 4, handled: true,
 * });
 * // Returns a validated WalkNode (branded fields)
 */
import { z } from 'zod';

import { lineNumberContract, symbolNameContract, syntaxKindNameContract } from '@assayer/shared/contracts';

export const walkNodeContract = z.object({
  kind: syntaxKindNameContract,
  scopePath: z.array(symbolNameContract),
  name: symbolNameContract.optional(),
  startLine: lineNumberContract,
  endLine: lineNumberContract,
  handled: z.boolean(),
});

export type WalkNode = z.infer<typeof walkNodeContract>;

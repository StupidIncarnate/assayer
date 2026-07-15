/**
 * PURPOSE: Contract for a dark spot — a node the walk RECOGNIZED as semantically load-bearing
 *   (control flow, a scope, an effect site) but could not follow, carrying the syntax kind it
 *   choked on, the scope path it sits in, why it went unfollowed, and its line span. Dark spots
 *   are the map's honesty mechanism: a map that silently omits a flow it could not trace is worse
 *   than no map, because a human spot-checks it, sees no hole, and wrongly trusts it. Unrecognized
 *   is therefore never invisible — the walk still descends the node's contents, it just admits it
 *   did not understand the node itself.
 *
 * USAGE:
 * darkSpotContract.parse({
 *   kind: 'ForStatement', scopePath: ['sumAll'], reason: 'unhandled-syntax', startLine: 3, endLine: 5,
 * });
 * // Returns a validated DarkSpot (branded fields)
 */
import { z } from 'zod';

import { lineNumberContract } from '../line-number/line-number-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { syntaxKindNameContract } from '../syntax-kind-name/syntax-kind-name-contract';

export const darkSpotContract = z.object({
  kind: syntaxKindNameContract,
  scopePath: z.array(symbolNameContract),
  reason: z.enum(['unhandled-syntax']).brand<'DarkSpotReason'>(),
  startLine: lineNumberContract,
  endLine: lineNumberContract,
});

export type DarkSpot = z.infer<typeof darkSpotContract>;

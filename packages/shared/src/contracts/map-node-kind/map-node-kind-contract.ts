/**
 * PURPOSE: Contract for the kind of a map node — the branch-construct classification used by
 *   the type-graph map (function, if, switch, ternary).
 *
 * USAGE:
 * const kind = mapNodeKindContract.parse('function');
 * // Returns a validated MapNodeKind (branded)
 */
import { z } from 'zod';

export const mapNodeKindContract = z.enum(['function', 'if', 'switch', 'ternary']).brand<'MapNodeKind'>();

export type MapNodeKind = z.infer<typeof mapNodeKindContract>;

/**
 * PURPOSE: Branded contract for one rendered CELL of the Contracts-tab inspector — a single monospace
 *   line the detail panel shows for a cross-file import / ambient global THIS file uses: the symbol,
 *   its source (`import '<path>' → <def>`, `pkg <name>`, or `global`), one `name: type` input line per
 *   param, or the `returns <type>` / `type <type>` output line. DISPLAY only — never read by analysis.
 *
 * USAGE:
 * resolvedEdgeLineContract.parse('name: string');
 * // Returns a branded ResolvedEdgeLine (one inspector cell)
 */
import { z } from 'zod';

export const resolvedEdgeLineContract = z.string().min(1).brand<'ResolvedEdgeLine'>();

export type ResolvedEdgeLine = z.infer<typeof resolvedEdgeLineContract>;

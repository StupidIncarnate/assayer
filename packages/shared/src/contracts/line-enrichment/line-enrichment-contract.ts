/**
 * PURPOSE: Contract for a line enrichment — a per-line data fact rendered in the enrichment panel:
 *   a symbol (identifier or operand expression), its type text, and an optional representative
 *   value range derived from the branch predicates that consume it.
 *
 * USAGE:
 * lineEnrichmentContract.parse({ line: 1, symbol: 'name', typeText: 'string' });
 * lineEnrichmentContract.parse({ line: 2, symbol: 'name.length', typeText: 'number', range: ['', 'a'] });
 * // Returns a validated LineEnrichment (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';

export const lineEnrichmentContract = z.object({
  line: z.number().int().positive().brand<'LineEnrichmentLine'>(),
  symbol: z.string().min(1).brand<'LineEnrichmentSymbol'>(),
  typeText: z.string().min(1).brand<'LineEnrichmentTypeText'>(),
  range: z.array(representativeValueContract).optional(),
});

export type LineEnrichment = z.infer<typeof lineEnrichmentContract>;

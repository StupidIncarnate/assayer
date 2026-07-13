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
import { z } from 'zod';

import { lineNumberContract } from '../line-number/line-number-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeTextContract } from '../type-text/type-text-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';

export const lineEnrichmentContract = z.object({
  line: lineNumberContract,
  symbol: symbolNameContract,
  typeText: typeTextContract,
  range: z.array(representativeValueContract).optional(),
});

export type LineEnrichment = z.infer<typeof lineEnrichmentContract>;

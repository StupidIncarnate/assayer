/**
 * PURPOSE: Contract for a symbol name — an identifier or short operand expression (a function
 *   name, a parameter name, or an operand like `name.length`) surfaced in analysis and rendered
 *   in the enrichment and tests panels.
 *
 * USAGE:
 * symbolNameContract.parse('formatGreeting');
 * // Returns a validated SymbolName (branded)
 */
import { z } from 'zod';

export const symbolNameContract = z.string().min(1).brand<'SymbolName'>();

export type SymbolName = z.infer<typeof symbolNameContract>;

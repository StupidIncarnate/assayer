/**
 * PURPOSE: Contract for a coverage ID — the cache-internal identity of a testable map node
 *   (a branch or an exit), keyed on scope path + condition/discriminant + arm and NEVER on
 *   line numbers, so it survives reformatting and changes only when the logic changes.
 *
 * USAGE:
 * coverageIdContract.parse('formatGreeting/if:name.length===0');
 * // Returns a validated CoverageId (branded)
 */
import { z } from 'zod';

export const coverageIdContract = z.string().min(1).brand<'CoverageId'>();

export type CoverageId = z.infer<typeof coverageIdContract>;

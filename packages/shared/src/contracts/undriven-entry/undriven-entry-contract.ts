/**
 * PURPOSE: Contract for an undriven entry — a scope Assayer UNDERSTOOD completely but its execution
 *   model does not reach, carrying the scope's name, its line span, and why no case drove it.
 *
 *   It is a THIRD admission that travels BESIDE gaps and dark spots and is never folded into either,
 *   because the two of them answer "who owes this work?" and neither answer is true here:
 *   - a GAP is the CALLER's debt — understood, not constructable, so a harness closes it;
 *   - a DARK SPOT is ASSAYER's debt — syntax it never understood, so no harness can close it;
 *   - an UNDRIVEN entry is understood perfectly AND out of every harness's reach: the runner has no
 *     way to CALL it yet. Filing it as a gap would order a reader to write a harness that cannot
 *     exist; filing it as a dark spot would claim the analyzer is blind exactly where it is not.
 *
 *   Required wherever it rides, for the reason `darkSpots` is: a file whose only logic is undriven
 *   would otherwise report zero cases, zero gaps and zero dark spots — identical to a file that is
 *   fully covered, which is the lie every admission channel here exists to prevent.
 *
 *   `reason` is product surface (P1), and is worded as NOT DRIVEN rather than undrivable. Every entry
 *   here waits on an Assayer feature, so text reading as permanent would be a lie the day one lands.
 *
 *   The span is the scope's own extent as the WALK measured it, which is why it is spelled the same as
 *   a dark spot's: both answer "which lines does this admission cover?", and one concept gets one
 *   shape. It lets a surface mark the region on the source rather than only naming it in a list — a
 *   scope stated in a side panel while its lines render like any other code reads as understood.
 *
 * USAGE:
 * undrivenEntryContract.parse({
 *   name: '*module*', reason: 'it runs at import time, so no case drove its branches…',
 *   startLine: 1, endLine: 8,
 * });
 * // Returns a validated UndrivenEntry (branded fields)
 */
import { z } from 'zod';

import { lineNumberContract } from '../line-number/line-number-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const undrivenEntryContract = z.object({
  name: symbolNameContract,
  reason: z.string().min(1).brand<'UndrivenReason'>(),
  startLine: lineNumberContract,
  endLine: lineNumberContract,
});

export type UndrivenEntry = z.infer<typeof undrivenEntryContract>;

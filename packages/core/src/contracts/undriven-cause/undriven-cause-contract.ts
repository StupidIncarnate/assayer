/**
 * PURPOSE: Contract for WHY the `derive-cases` steerability gate refused to drive a branch — the two
 *   blockers it distinguishes, carried to the admission text so the reader is sent to the right place.
 *
 *   `unarrangeable-operand` — the deciding value is not an input this entry has: not one of its
 *   parameters, not an environment variable a module scope reads, not a constant welded in the source.
 *   The repo change is to make it one.
 *
 *   `unread-comparison` — the operand IS arrangeable, but the comparison against it names no value, so
 *   there is nothing to satisfy and nothing to violate. The repo change is to compare against a literal.
 *
 *   They are separate because the remedies contradict: telling a reader to make `m` a parameter when it
 *   already is one is advice they cannot act on, which is the one thing a P1 may never be.
 *
 * USAGE:
 * undrivenCauseContract.parse('unread-comparison');
 * // Returns a validated UndrivenCause (branded)
 */
import { z } from 'zod';

export const undrivenCauseContract = z.enum(['unarrangeable-operand', 'unread-comparison']).brand<'UndrivenCause'>();

export type UndrivenCause = z.infer<typeof undrivenCauseContract>;

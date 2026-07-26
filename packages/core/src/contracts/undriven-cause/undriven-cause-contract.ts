/**
 * PURPOSE: Contract for WHY the `derive-cases` steerability gate refused to drive a branch — the
 *   blockers it distinguishes, carried to the admission text so the reader is sent to the right place.
 *
 *   `unarrangeable-operand` — the deciding value is not an input this entry has: not one of its
 *   parameters, not an environment variable a module scope reads, not a constant welded in the source.
 *   The repo change is to make it one.
 *
 *   `unarrangeable-typeof` — the operand IS a `typeof` read of a value that may already be one of the
 *   entry's own parameters, but Assayer does not decompose a `typeof` comparison into a case per branch.
 *   There is no repo change that closes it today; the capability is a followup.
 *
 *   `unarrangeable-property-depth` — the operand names a parameter's property, but the path is more than
 *   ONE segment deep (`config.db.retry`, not `config.mode`). A one-segment path is closed at CONSUME
 *   time by `stub-realize` arranging the object from the merged stub view (and so never reaches this
 *   cause); a deeper one is a capability `object-arrange` does not have yet, and is a followup, not a
 *   repo change the reader can make.
 *
 *   `unread-comparison` — the operand IS arrangeable, but the comparison against it names no value, so
 *   there is nothing to satisfy and nothing to violate. The repo change is to compare against a literal.
 *
 *   They stay separate because the remedies contradict: telling a reader to make `m` a parameter when it
 *   already is one, or to make `config` a parameter when a `typeof`/property-depth read is the actual
 *   limit, is advice they cannot act on — which is the one thing a P1 may never be.
 *
 * USAGE:
 * undrivenCauseContract.parse('unread-comparison');
 * // Returns a validated UndrivenCause (branded)
 */
import { z } from 'zod';

export const undrivenCauseContract = z
  .enum(['unarrangeable-operand', 'unarrangeable-typeof', 'unarrangeable-property-depth', 'unread-comparison'])
  .brand<'UndrivenCause'>();

export type UndrivenCause = z.infer<typeof undrivenCauseContract>;

/**
 * PURPOSE: Contract for WHY the `derive-cases` steerability gate refused to drive a branch — the
 *   blockers it distinguishes, carried to the admission text so the reader is sent to the right place.
 *
 *   `unarrangeable-operand` — the deciding value is not an input this entry has: not one of its
 *   parameters, not an environment variable a module scope reads, not a constant welded in the source.
 *   The repo change is to make it one. An object-member read (`config.mode`, `config.db.retry`, at any
 *   depth) reaches this cause too: it names a real parameter, but an object param's property is not
 *   scalar-arrangeable in the per-file view (§5.12), so it is closed later, at CONSUME time, by
 *   `stub-realize` arranging the object from the merged stub view.
 *
 *   `unarrangeable-typeof` — the operand is a `typeof` read whose OWN operand is opaque (a call result, a
 *   member access with no parameter root), so Assayer cannot even ask what the comparison narrows.
 *   There is no repo change that closes it today; the capability is a followup.
 *
 *   `unarrangeable-typeof-member` — the operand is a `typeof` read of a real parameter, and the
 *   comparison DOES narrow the parameter's type by which member carries the compared-against runtime
 *   tag, but on at least one side every matching member is a shape (an object, an array) this engine has
 *   no scalar point to realize from a union on its own. The comparison is read correctly; only picking
 *   that one union member is unbuilt. There is no repo change that closes it today; the capability is a
 *   followup.
 *
 *   `unread-comparison` — the operand IS arrangeable, but the comparison against it names no value, so
 *   there is nothing to satisfy and nothing to violate. The repo change is to compare against a literal.
 *
 *   They stay separate because the remedies contradict: telling a reader to make `m` a parameter when it
 *   already is one is advice they cannot act on — which is the one thing a P1 may never be.
 *
 * USAGE:
 * undrivenCauseContract.parse('unread-comparison');
 * // Returns a validated UndrivenCause (branded)
 */
import { z } from '#gateway/npm/zod';

export const undrivenCauseContract = z
  .enum(['unarrangeable-operand', 'unarrangeable-typeof', 'unarrangeable-typeof-member', 'unread-comparison'])
  .brand<'UndrivenCause'>();

export type UndrivenCause = z.infer<typeof undrivenCauseContract>;

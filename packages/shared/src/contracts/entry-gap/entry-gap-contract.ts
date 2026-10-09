/**
 * PURPOSE: Contract for an entry gap — the CALLER's debt about one entry: Assayer understood it
 *   completely and cannot drive it as it stands, and a human supplying what is missing closes it.
 *
 *   One shape, one spelling, three artifacts. The same gap rides the FileAnalysis (a fact about the
 *   file, true the moment it is opened), the CaseSet (what the interpreter was handed) and the
 *   RunResult (what a reader is shown), because they are the same admission at three distances from
 *   the reader, not three admissions. Two encodings of one concept is how a surface comes to describe
 *   an artifact differently from the artifact.
 *
 *   The channel holds an INPUT no value of the declared type can be built for. A harness closes it by
 *   supplying what Assayer cannot derive, which is why a gap shares no channel with a dark spot, an
 *   undriven entry or a lint — those name Assayer's debt, Assayer's reach, and the repo's debt
 *   respectively.
 *
 *   `name` keys the gap to its entry, so a surface can pair it with the entry it is about. `reason` is
 *   product surface (P1): it names what is missing, where, and the concrete thing that satisfies the
 *   check, written for an LLM to act on with no human in the loop.
 *
 * USAGE:
 * entryGapContract.parse({ name: 'audit', reason: '`audit` derives no case, because Assayer cannot construct an input it needs…' });
 * // Returns a validated EntryGap (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { entrySignatureContract } from '../entry-signature/entry-signature-contract';

export const entryGapContract = z.object({
  name: entrySignatureContract.shape.name,
  reason: z.string().min(1).brand<'EntryGapReason'>(),
}).brand<'EntryGap'>();

export type EntryGap = z.infer<typeof entryGapContract>;

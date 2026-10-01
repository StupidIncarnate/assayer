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
 *   Two producers fill the channel and neither is privileged: an INPUT no value of the declared type
 *   can be built for, and an ACCESS the runner cannot reach through (a constructor, a method whose
 *   class needs constructor arguments). Both are closed by the caller supplying what Assayer cannot
 *   derive, which is why they share a channel where a dark spot, an undriven entry and a lint never
 *   could — those name Assayer's debt, Assayer's reach, and the repo's debt respectively.
 *
 *   `name` keys the gap to its entry, so a surface can pair it with the entry it is about. `reason` is
 *   product surface (P1): it names what is missing, where, and the concrete thing that satisfies the
 *   check, written for an LLM to act on with no human in the loop.
 *
 * USAGE:
 * entryGapContract.parse({ name: 'find', reason: 'its class needs constructor arguments…' });
 * // Returns a validated EntryGap (branded fields)
 */
import { z } from '#gateway/npm/zod';


export const entryGapContract = z.object({
  name: z.string().min(1).brand<'EntryGapName'>(),
  reason: z.string().min(1).brand<'EntryGapReason'>(),
}).brand<'EntryGap'>();

export type EntryGap = z.infer<typeof entryGapContract>;

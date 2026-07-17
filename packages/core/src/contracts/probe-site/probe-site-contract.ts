/**
 * PURPOSE: Contract for a probe site — where the instrumenter must observe, and the coverage ID the
 *   resulting runtime observation is keyed under. It is the bridge between static derivation and live
 *   execution: because the WALK emits these, the id a probe reports at runtime is the same id the
 *   analyzer derived, from the same traversal. Deriving them twice would be two encodings of one
 *   concept and would drift.
 *
 *   The kinds differ in WHAT the instrumenter does at the span, which is the only thing they could
 *   differ in:
 *   - `cond` and `exit` name an EXPRESSION, wrapped in place. In place is what preserves
 *     short-circuit and value semantics — the probe sits exactly where the expression sat.
 *   - `complete` names a statement CONTAINER — a block, an arm, or the file — and the probe is
 *     APPENDED as its last statement. An implicit exit has no expression to wrap: falling off the end
 *     of an arm is an event with no value and no syntax, so the only way to observe it is to put a
 *     statement where it happens. Without this kind an implicit exit is unobservable, and a case
 *     predicting one can only ever report "reached no exit" against code that reached it perfectly.
 *
 *   `start`/`end` are character offsets, and they are the reason a probe plan is a CACHE-INTERNAL
 *   SIDECAR that is never diffed and never rides in the analysis blob: a coverage ID must not move
 *   when formatting changes, but every offset does. The plan is keyed by the source's content hash,
 *   so offsets can only ever be read against the exact bytes they were computed from.
 *
 * USAGE:
 * probeSiteContract.parse({ id: 'grade/if:…#leaf.0', kind: 'cond', start: 64, end: 73 });
 * // Returns a validated ProbeSite (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '@assayer/shared/contracts';

export const probeSiteContract = z.object({
  id: coverageIdContract,
  kind: z.enum(['cond', 'exit', 'complete']).brand<'ProbeKind'>(),
  start: z.number().int().min(0).brand<'SourceOffset'>(),
  end: z.number().int().min(0).brand<'SourceOffset'>(),
});

export type ProbeSite = z.infer<typeof probeSiteContract>;

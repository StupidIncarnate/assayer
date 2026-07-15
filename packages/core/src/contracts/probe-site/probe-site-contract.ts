/**
 * PURPOSE: Contract for a probe site — where the instrumenter must wrap an expression, and the
 *   coverage ID the resulting runtime observation is keyed under. It is the bridge between static
 *   derivation and live execution: because the WALK emits these, the id a probe reports at runtime is
 *   the same id the analyzer derived, from the same traversal. Deriving them twice would be two
 *   encodings of one concept and would drift.
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
  kind: z.enum(['cond', 'exit']).brand<'ProbeKind'>(),
  start: z.number().int().min(0).brand<'SourceOffset'>(),
  end: z.number().int().min(0).brand<'SourceOffset'>(),
});

export type ProbeSite = z.infer<typeof probeSiteContract>;

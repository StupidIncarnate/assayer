/**
 * PURPOSE: Contract for one trace event — a probe firing at runtime, keyed by the SAME coverage ID
 *   the analyzer derived. The trace is the single observation layer: the runner reads it to decide
 *   pass/fail, and the UI renders it as the path through the file. Two consumers, one source, so what
 *   a human sees can never drift from what a test verified.
 *
 *   `outcome` is the leaf's boolean contribution. It is derived as `Boolean(value)` at capture, which
 *   is uniform rather than a special case: a comparison leaf is already boolean (identity), while a
 *   truthiness leaf like `!user` wraps the raw operand — and Boolean() IS that leaf's `truthy`
 *   predicate.
 *
 *   `valueText` is DISPLAY-ONLY and never read by analysis — the same line already drawn around
 *   `displayLines` and `conditionText`. It exists because P4 forbids ASSERTING an observed value, not
 *   because it forbids SHOWING one: value-correctness is a human-review concern, and this is the
 *   surface that serves it. It must never enter an expectation, a baseline, or a blessed record.
 *
 *   A leaf that never fired has NO event. Absent is not false — it is "the language never evaluated
 *   this" — and that distinction is what branch coverage throws away.
 *
 * USAGE:
 * traceEventContract.parse({ id: 'grade/if:…#leaf.0', kind: 'cond', outcome: true, valueText: 'true' });
 * // Returns a validated TraceEvent (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { traceValueTextContract } from '../trace-value-text/trace-value-text-contract';

export const traceEventContract = z.object({
  id: coverageIdContract,
  kind: z.enum(['cond', 'exit']).brand<'TraceKind'>(),
  outcome: z.boolean().optional(),
  valueText: traceValueTextContract,
});

export type TraceEvent = z.infer<typeof traceEventContract>;

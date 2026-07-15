/**
 * PURPOSE: Contract for a trace value's DISPLAY rendering — the "what came out" text shown beside a
 *   case. Text, never the value itself: a trace must be JSON-serializable, and rendering at capture
 *   is also what keeps an observed value from ever being mistaken for an expectation. P4 forbids
 *   ASSERTING what the code returned, not SHOWING it — and text cannot be asserted against by accident.
 *
 *   Never read by analysis, exactly like `displayLines` and `conditionText`.
 *
 * USAGE:
 * traceValueTextContract.parse("'pass'");
 * // Returns a validated TraceValueText (branded)
 */
import { z } from 'zod';

export const traceValueTextContract = z.string().min(1).brand<'TraceValueText'>();

export type TraceValueText = z.infer<typeof traceValueTextContract>;

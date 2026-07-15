/**
 * PURPOSE: The shape of the `__P` runtime that instrumented code calls and the interpreter reads
 *   back. It lives in contracts rather than beside the adapter that builds it because BOTH the
 *   builder and the interpreter need it, and an adapter may not import another adapter.
 *
 *   `z.custom` rather than a validating schema, deliberately: its members are FUNCTIONS, which is
 *   exactly what runtime validation cannot describe, and this object is always CONSTRUCTED in-process
 *   — never parsed from JSON, never crossing a boundary. What does cross a boundary is its `events`,
 *   and those are contract-validated as they are pushed.
 *
 *   Every probe returns its value untouched; that is what makes instrumentation semantically
 *   invisible, short-circuit included.
 *
 * USAGE:
 * const probe: ProbeRuntime = jestProbeRuntimeAdapter();
 * // probe.c(id, value) records and returns value
 */
import { z } from 'zod';

import type { CoverageId, TraceEvent } from '@assayer/shared/contracts';

export interface ProbeRuntime {
  events: TraceEvent[];
  reset: () => void;
  c: (id: CoverageId, value: unknown) => unknown;
  x: (id: CoverageId, value: unknown) => unknown;
}

export const probeRuntimeContract = z.custom<ProbeRuntime>(
  (value) => typeof value === 'object' && value !== null && 'events' in value && 'reset' in value,
);

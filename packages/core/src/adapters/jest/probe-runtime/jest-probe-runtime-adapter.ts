/**
 * PURPOSE: Builds the `__P` runtime the instrumented code calls — the single observation layer. The
 *   runner reads its events to decide pass/fail; the UI renders the same events as the path through
 *   the file. Two consumers, one source, so what a human sees cannot drift from what a test verified.
 *
 *   Every probe RETURNS its value untouched. That is what makes instrumentation semantically
 *   invisible: `__P.c(id, a) && __P.c(id2, b)` evaluates exactly as `a && b` did, short-circuit
 *   included, so a leaf the language skips simply never records — absent stays distinguishable from
 *   false.
 *
 *   `outcome` is `Boolean(value)`, which is uniform rather than a special case: a comparison leaf is
 *   already boolean (identity), while a truthiness leaf like `!user` wraps the raw operand — and
 *   Boolean() IS that leaf's `truthy` predicate.
 *
 * USAGE:
 * const probe = jestProbeRuntimeAdapter();
 * probe.c('grade/if:x#leaf.0', score > 5);   // records, returns the value
 * // probe.events => [{ id, kind: 'cond', outcome: true, valueText: 'true' }]
 */
import { traceEventContract } from '@assayer/shared/contracts';
import type { TraceEvent } from '@assayer/shared/contracts';

import type { ProbeRuntime } from '../../../contracts/probe-runtime/probe-runtime-contract';
import { renderTraceValueTransformer } from '../../../transformers/render-trace-value/render-trace-value-transformer';

export const jestProbeRuntimeAdapter = (): ProbeRuntime => {
  const events: TraceEvent[] = [];

  return {
    events,
    reset: (): void => {
      events.length = 0;
    },
    c: (id, value): unknown => {
      events.push(
        traceEventContract.parse({
          id,
          kind: 'cond',
          outcome: Boolean(value),
          valueText: renderTraceValueTransformer({ value }),
        }),
      );

      return value;
    },
    x: (id, value): unknown => {
      events.push(
        traceEventContract.parse({ id, kind: 'exit', valueText: renderTraceValueTransformer({ value }) }),
      );

      return value;
    },
  };
};

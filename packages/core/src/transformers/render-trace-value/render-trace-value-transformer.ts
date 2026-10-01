/**
 * PURPOSE: Renders an observed runtime value into DISPLAY text for a trace event — the "what came
 *   out" a human reads next to a case.
 *
 *   It renders rather than stores because a trace must be JSON-serializable and a probe can see
 *   anything the language can produce: functions, symbols, cycles, BigInt. Rendering at capture keeps
 *   the artifact writable and keeps the value where it belongs — P4 forbids ASSERTING an observed
 *   value, not showing one, and text is the shape that cannot accidentally become an expectation.
 *
 *   Never read by analysis, exactly like `displayLines` and `conditionText`.
 *
 * USAGE:
 * renderTraceValueTransformer({ value: 'pass' });
 * // Returns "'pass'" (branded TraceValueText)
 */

export const renderTraceValueTransformer = ({ value }: { value: unknown }): string => {
  if (typeof value === 'string') {
    return `'${value}'`;
  }

  if (typeof value === 'bigint') {
    return `${value.toString()}n`;
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  // JSON.stringify(undefined) is undefined, not a string — so undefined needs its own arm or the
  // contract's min-length parse would reject the event.
  if (value === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(value);
  } catch {
    // A cyclic or otherwise unserializable value must not take the run down: the trace is a display
    // surface, so it degrades to a label rather than throwing.
    return '[Unserializable]';
  }
};

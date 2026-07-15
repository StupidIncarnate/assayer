/**
 * PURPOSE: Immutable display vocabulary for a case's run status — the marker and colour each of
 *   passed / failed / not-run renders with.
 *
 *   `not-run` is deliberately given its own visible marker rather than nothing. A case with no result
 *   rendering as blank reads as a case that passed, which is the one lie this panel must not tell.
 *
 * USAGE:
 * runStatusStatics.marker.passed;
 * // Returns 'PASS'
 */
export const runStatusStatics = {
  marker: {
    passed: 'PASS',
    failed: 'FAIL',
    'not-run': 'not run',
  },
  colour: {
    passed: 'teal.4',
    failed: 'red.4',
    'not-run': 'dark.2',
  },
} as const;

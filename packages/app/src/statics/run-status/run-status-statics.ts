/**
 * PURPOSE: Immutable display vocabulary for a case's run status — the marker and colour each of
 *   passed / failed / errored / not-run renders with.
 *
 *   `not-run` is deliberately given its own visible marker rather than nothing. A case with no result
 *   rendering as blank reads as a case that passed, which is the one lie this panel must not tell.
 *
 *   `errored` gets its own marker AND its own colour. Sharing red with `failed` would leave the two
 *   distinguishable only by reading the word, and the whole reason they are separate outcomes is that
 *   they send the reader to different places — the derivation for a FAIL, the arrange for an ERROR.
 *   Orange is the one that has to catch the eye: an errored case is usually a value the code could not
 *   use at all.
 *
 * USAGE:
 * runStatusStatics.marker.passed;
 * // Returns 'PASS'
 */
export const runStatusStatics = {
  marker: {
    passed: 'PASS',
    failed: 'FAIL',
    errored: 'ERROR',
    'not-run': 'not run',
  },
  colour: {
    passed: 'teal.4',
    failed: 'red.4',
    errored: 'orange.5',
    'not-run': 'dark.2',
  },
} as const;

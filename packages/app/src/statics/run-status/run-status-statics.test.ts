import { runStatusStatics } from './run-status-statics';

describe('runStatusStatics', () => {
  describe('markers', () => {
    it('VALID: marker => one per status, with not-run visible rather than blank', () => {
      expect(runStatusStatics.marker).toStrictEqual({
        passed: 'PASS',
        failed: 'FAIL',
        errored: 'ERROR',
        'not-run': 'not run',
      });
    });
  });

  describe('colours', () => {
    // errored does NOT share failed's red. The two outcomes send the reader to different places — the
    // derivation for a FAIL, the arrange for an ERROR — and a shared colour leaves them separable only
    // by reading the word.
    it('VALID: colour => one per status, errored distinct from failed', () => {
      expect(runStatusStatics.colour).toStrictEqual({
        passed: 'teal.4',
        failed: 'red.4',
        errored: 'orange.5',
        'not-run': 'dark.2',
      });
    });
  });
});

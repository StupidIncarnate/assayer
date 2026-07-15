import { runStatusStatics } from './run-status-statics';

describe('runStatusStatics', () => {
  describe('markers', () => {
    it('VALID: marker => one per status, with not-run visible rather than blank', () => {
      expect(runStatusStatics.marker).toStrictEqual({ passed: 'PASS', failed: 'FAIL', 'not-run': 'not run' });
    });
  });

  describe('colours', () => {
    it('VALID: colour => one per status', () => {
      expect(runStatusStatics.colour).toStrictEqual({
        passed: 'teal.4',
        failed: 'red.4',
        'not-run': 'dark.2',
      });
    });
  });
});

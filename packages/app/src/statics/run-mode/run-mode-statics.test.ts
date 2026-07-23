import { runModeStatics } from './run-mode-statics';

describe('runModeStatics', () => {
  describe('markers', () => {
    it('VALID: marker => the salient badge reads INTELLIGENT', () => {
      expect(runModeStatics.marker).toStrictEqual({ intelligent: 'INTELLIGENT' });
    });
  });

  describe('colours', () => {
    it('VALID: colour => the salient badge is violet', () => {
      expect(runModeStatics.colour).toStrictEqual({ intelligent: 'violet.4' });
    });
  });
});

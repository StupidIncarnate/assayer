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

  describe('explanations', () => {
    it('VALID: explanation => explains the salient subset meaning', () => {
      expect(runModeStatics.explanation).toStrictEqual({
        intelligent:
          'Intelligent mode runs the minimum tests needed to cover every distinct output. Other cases test alternative inputs that reach the same result.',
      });
    });
  });

  describe('tooltips', () => {
    it('VALID: tooltip => mirrors the explanation for tooltip consumers', () => {
      expect(runModeStatics.tooltip).toStrictEqual({
        intelligent:
          'Intelligent mode runs the minimum tests needed to cover every distinct output. Other cases test alternative inputs that reach the same result.',
      });
    });
  });
});

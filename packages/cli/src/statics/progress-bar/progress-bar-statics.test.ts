import { progressBarStatics } from './progress-bar-statics';

describe('progressBarStatics', () => {
  describe('bar', () => {
    it('VALID: bar.width => is 20', () => {
      expect(progressBarStatics.bar.width).toBe(20);
    });

    it('VALID: bar.filledChar => is "#"', () => {
      expect(progressBarStatics.bar.filledChar).toBe('#');
    });

    it('VALID: bar.emptyChar => is "-"', () => {
      expect(progressBarStatics.bar.emptyChar).toBe('-');
    });
  });
});

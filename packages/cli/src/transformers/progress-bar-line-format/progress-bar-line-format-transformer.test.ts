import { progressBarLineFormatTransformer } from './progress-bar-line-format-transformer';

describe('progressBarLineFormatTransformer', () => {
  describe('valid progress', () => {
    it('VALID: {label: "main", current: 0, max: 10} => returns fully empty bar', () => {
      const result = progressBarLineFormatTransformer({ label: 'main', current: 0, max: 10 });

      expect(result).toBe('main: -------------------- 0/10');
    });

    it('VALID: {label: "main", current: 5, max: 10} => returns half-filled bar', () => {
      const result = progressBarLineFormatTransformer({ label: 'main', current: 5, max: 10 });

      expect(result).toBe('main: ##########---------- 5/10');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {label: "main", current: 10, max: 10} => returns fully filled bar', () => {
      const result = progressBarLineFormatTransformer({ label: 'main', current: 10, max: 10 });

      expect(result).toBe('main: #################### 10/10');
    });

    it('EDGE: {label: "main", current: 0, max: 0} => avoids division by zero, returns fully empty bar', () => {
      const result = progressBarLineFormatTransformer({ label: 'main', current: 0, max: 0 });

      expect(result).toBe('main: -------------------- 0/0');
    });
  });
});

import { progressBarLineContract } from './progress-bar-line-contract';
import { ProgressBarLineStub } from './progress-bar-line.stub';

describe('progressBarLineContract', () => {
  describe('valid lines', () => {
    it('VALID: {value: "main: -------------------- 0/10"} => parses successfully', () => {
      const line = ProgressBarLineStub({ value: 'main: -------------------- 0/10' });

      const result = progressBarLineContract.parse(line);

      expect(result).toBe('main: -------------------- 0/10');
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return progressBarLineContract.parse('');
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});

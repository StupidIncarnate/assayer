import { testPathPatternContract } from './test-path-pattern-contract';
import { TestPathPatternStub } from './test-path-pattern.stub';

describe('testPathPatternContract', () => {
  describe('valid patterns', () => {
    it('VALID: {stub default} => the pattern verbatim', () => {
      expect(String(TestPathPatternStub())).toBe('/cache/runs/r1/');
    });

    it('VALID: {an escaped pattern} => the backslashes survive, since they are the escaping', () => {
      expect(String(testPathPatternContract.parse('/cache/\\.assayer/runs/r1/'))).toBe('/cache/\\.assayer/runs/r1/');
    });
  });

  describe('invalid patterns', () => {
    // An empty pattern matches EVERY test file rather than none, so it would silently run the whole
    // cache instead of the one run asked for.
    it('EMPTY: {empty string} => throws rather than matching everything', () => {
      expect(() => testPathPatternContract.parse('')).toThrow(/at least 1/u);
    });
  });
});

import { derivedTestCaseContract } from './derived-test-case-contract';
import { DerivedTestCaseStub } from './derived-test-case.stub';

describe('derivedTestCaseContract', () => {
  describe('valid derived test cases', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const testCase = DerivedTestCaseStub();

      const result = derivedTestCaseContract.parse(testCase);

      expect(result).toStrictEqual(testCase);
    });

    it('VALID: {arrange: []} => parses an unconstrained case', () => {
      const testCase = DerivedTestCaseStub({ reachesPath: ['run/exit@implicit'], arrange: [] });

      const result = derivedTestCaseContract.parse(testCase);

      expect(result).toStrictEqual(testCase);
    });

    it('VALID: {no arms, driven or fewestRuns} => defaults to no arms, driven, and in the fewest-runs set', () => {
      const result = derivedTestCaseContract.parse({ reachesPath: ['run/exit@implicit'], arrange: [] });

      expect(result).toStrictEqual({ reachesPath: ['run/exit@implicit'], arrange: [], arms: [], driven: true, fewestRuns: true });
    });

    it('VALID: {fewestRuns: false, driven: false} => preserved as an undriven case outside the fewest-runs set', () => {
      const result = derivedTestCaseContract.parse({
        reachesPath: ['run/exit@implicit'],
        arrange: [],
        arms: [{ branchCoverageId: 'run/if:a', arm: 'then' }],
        driven: false,
        fewestRuns: false,
      });

      expect(result).toStrictEqual({
        reachesPath: ['run/exit@implicit'],
        arrange: [],
        arms: [{ branchCoverageId: 'run/if:a', arm: 'then' }],
        driven: false,
        fewestRuns: false,
      });
    });

    it('VALID: {an array arrange} => parses the list of element values a case passes for the param', () => {
      const testCase = DerivedTestCaseStub({
        reachesPath: ['count/return@top'],
        arrange: [{ kind: 'array', param: 'items', value: [7] }],
      });

      const result = derivedTestCaseContract.parse(testCase);

      expect(result).toStrictEqual(testCase);
    });
  });

  describe('invalid derived test cases', () => {
    it('INVALID: {reachesPath: [""]} => throws validation error', () => {
      expect(() => {
        return derivedTestCaseContract.parse({ reachesPath: [''], arrange: [] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});

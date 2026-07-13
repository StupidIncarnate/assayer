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
      const testCase = DerivedTestCaseStub({ reachesExit: 'run/exit@implicit', arrange: [] });

      const result = derivedTestCaseContract.parse(testCase);

      expect(result).toStrictEqual(testCase);
    });
  });

  describe('invalid derived test cases', () => {
    it('INVALID: {reachesExit: ""} => throws validation error', () => {
      expect(() => {
        return derivedTestCaseContract.parse({ reachesExit: '', arrange: [] });
      }).toThrow(/at least 1 character/u);
    });
  });
});

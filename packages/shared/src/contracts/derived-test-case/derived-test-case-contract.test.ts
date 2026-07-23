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

    it('VALID: {no salient field} => defaults salient to true so stale cache blobs read as all-salient', () => {
      const result = derivedTestCaseContract.parse({ reachesExit: 'run/exit@implicit', arrange: [] });

      expect(result).toStrictEqual({ reachesExit: 'run/exit@implicit', arrange: [], salient: true });
    });

    it('VALID: {salient: false} => preserved as the not-must-run flag', () => {
      const result = derivedTestCaseContract.parse({ reachesExit: 'run/exit@implicit', arrange: [], salient: false });

      expect(result).toStrictEqual({ reachesExit: 'run/exit@implicit', arrange: [], salient: false });
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

import { caseRunStatusContract } from './case-run-status-contract';
import { CaseRunStatusStub } from './case-run-status.stub';

describe('caseRunStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: {stub default} => not-run', () => {
      expect(caseRunStatusContract.parse(CaseRunStatusStub())).toBe('not-run');
    });

    it('VALID: {passed} => parses', () => {
      expect(caseRunStatusContract.parse('passed')).toBe('passed');
    });

    it('VALID: {failed} => parses', () => {
      expect(caseRunStatusContract.parse('failed')).toBe('failed');
    });
  });

  describe('invalid statuses', () => {
    // A case with no result must never be able to render as one that passed.
    it('INVALID: {an invented status} => throws', () => {
      expect(() => {
        return caseRunStatusContract.parse('probably-fine');
      }).toThrow(/Invalid enum value/u);
    });
  });
});

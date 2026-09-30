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

    // Its own member, never collapsed into failed: a case that reached the wrong exit and one that
    // reached none send the reader to different places.
    it('VALID: {errored} => parses', () => {
      expect(caseRunStatusContract.parse('errored')).toBe('errored');
    });
  });

  describe('invalid statuses', () => {
    // A case with no result must never be able to render as one that passed.
    it('INVALID: {an invented status} => throws', () => {
      expect(() => {
        return caseRunStatusContract.parse('probably-fine');
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});

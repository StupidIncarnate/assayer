import { caseSignatureContract } from './case-signature-contract';
import { CaseSignatureStub } from './case-signature.stub';

describe('caseSignatureContract', () => {
  describe('valid signatures', () => {
    it('VALID: {an exit and its arrange json} => parses unchanged', () => {
      expect(caseSignatureContract.parse('*module*/f/return@top::[{"kind":"param"}]')).toBe(
        '*module*/f/return@top::[{"kind":"param"}]',
      );
    });

    it('VALID: {stub default} => parses unchanged', () => {
      expect(caseSignatureContract.parse(CaseSignatureStub())).toBe('*module*/f/return@top::[]');
    });
  });

  describe('invalid signatures', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        return caseSignatureContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});

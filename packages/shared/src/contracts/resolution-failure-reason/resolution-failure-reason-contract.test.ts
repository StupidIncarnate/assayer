import { resolutionFailureReasonContract } from './resolution-failure-reason-contract';
import { ResolutionFailureReasonStub } from './resolution-failure-reason.stub';

describe('resolutionFailureReasonContract', () => {
  describe('valid reasons', () => {
    it('VALID: {value: "cannot-resolve-specifier"} => parses the broken-import reason', () => {
      const reason = ResolutionFailureReasonStub({ value: 'cannot-resolve-specifier' });

      const result = resolutionFailureReasonContract.parse(reason);

      expect(result).toBe('cannot-resolve-specifier');
    });

    it('VALID: {value: "dynamic-or-computed-specifier"} => parses the non-literal-specifier reason', () => {
      const result = resolutionFailureReasonContract.parse('dynamic-or-computed-specifier');

      expect(result).toBe('dynamic-or-computed-specifier');
    });

    it('VALID: {value: "no-usable-types"} => parses the no-types reason', () => {
      const result = resolutionFailureReasonContract.parse('no-usable-types');

      expect(result).toBe('no-usable-types');
    });
  });

  describe('invalid reasons', () => {
    it('INVALID: {value: "who-knows"} => throws validation error', () => {
      expect(() => {
        return resolutionFailureReasonContract.parse('who-knows');
      }).toThrow(/Invalid enum value/u);
    });
  });
});

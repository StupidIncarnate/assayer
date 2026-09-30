import { undrivenCauseContract } from './undriven-cause-contract';
import { UndrivenCauseStub } from './undriven-cause.stub';

describe('undrivenCauseContract', () => {
  describe('valid causes', () => {
    it('VALID: {unarrangeable-operand} => parses unchanged', () => {
      expect(undrivenCauseContract.parse('unarrangeable-operand')).toBe('unarrangeable-operand');
    });

    it('VALID: {unarrangeable-typeof} => parses unchanged', () => {
      expect(undrivenCauseContract.parse('unarrangeable-typeof')).toBe('unarrangeable-typeof');
    });

    it('VALID: {unarrangeable-typeof-member} => parses unchanged', () => {
      expect(undrivenCauseContract.parse('unarrangeable-typeof-member')).toBe('unarrangeable-typeof-member');
    });

    it('VALID: {unread-comparison} => parses unchanged', () => {
      expect(undrivenCauseContract.parse('unread-comparison')).toBe('unread-comparison');
    });

    it('VALID: {stub default} => parses unchanged', () => {
      expect(undrivenCauseContract.parse(UndrivenCauseStub())).toBe('unarrangeable-operand');
    });
  });

  describe('invalid causes', () => {
    it('INVALID: {a cause outside the four blockers} => throws validation error', () => {
      expect(() => {
        return undrivenCauseContract.parse('undriven');
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});

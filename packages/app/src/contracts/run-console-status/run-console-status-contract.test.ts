import { runConsoleStatusContract } from './run-console-status-contract';
import { RunConsoleStatusStub } from './run-console-status.stub';

describe('runConsoleStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: {stub default} => finished', () => {
      expect(runConsoleStatusContract.parse(RunConsoleStatusStub())).toBe('finished');
    });

    it('VALID: {running} => parses', () => {
      expect(runConsoleStatusContract.parse('running')).toBe('running');
    });

    // A run that could not happen writes no output, exactly as a quiet successful one does. Without a
    // member of its own it would be reported as 'finished' — the failure told as a success.
    it('VALID: {failed} => parses', () => {
      expect(runConsoleStatusContract.parse('failed')).toBe('failed');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: {an invented status} => throws', () => {
      expect(() => {
        return runConsoleStatusContract.parse('probably-fine');
      }).toThrow(/Invalid enum value/u);
    });
  });
});

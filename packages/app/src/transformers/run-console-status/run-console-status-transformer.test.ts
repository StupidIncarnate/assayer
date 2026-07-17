import { runConsoleStatusTransformer } from './run-console-status-transformer';

describe('runConsoleStatusTransformer', () => {
  describe('a run in flight', () => {
    it('VALID: {running} => running', () => {
      const result = runConsoleStatusTransformer({ running: true, failed: false });

      expect(String(result)).toBe('running');
    });

    // Running is the more recent truth: the console is being written to right now, whatever a
    // previous attempt did.
    it('EDGE: {running and failed} => running outranks the failure', () => {
      const result = runConsoleStatusTransformer({ running: true, failed: true });

      expect(String(result)).toBe('running');
    });
  });

  describe('a run that ended', () => {
    it('VALID: {neither running nor failed} => finished', () => {
      const result = runConsoleStatusTransformer({ running: false, failed: false });

      expect(String(result)).toBe('finished');
    });

    // A run that could not happen writes no output, exactly as a quiet successful run does. Calling
    // this 'finished' would report the failure as a success.
    it('ERROR: {failed} => failed rather than finished', () => {
      const result = runConsoleStatusTransformer({ running: false, failed: true });

      expect(String(result)).toBe('failed');
    });
  });
});

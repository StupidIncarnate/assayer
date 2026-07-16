import { runConsoleStatics } from './run-console-statics';

describe('runConsoleStatics', () => {
  describe('status vocabulary', () => {
    // Finished is a STATED value, not the absence of "Running…": a report that stopped writing and
    // one still being written are indistinguishable without it.
    it('VALID: status => one phrase per end of the run', () => {
      expect(runConsoleStatics.status).toStrictEqual({ running: 'Running…', finished: 'Finished' });
    });
  });

  describe('waiting vocabulary', () => {
    it('VALID: waitingMessage => names what is being waited on', () => {
      expect(runConsoleStatics.waitingMessage).toBe('Waiting for the CLI…');
    });
  });
});

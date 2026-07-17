import { runConsoleStatics } from './run-console-statics';

describe('runConsoleStatics', () => {
  describe('status vocabulary', () => {
    // Finished is a STATED value, not the absence of "Running…": a report that stopped writing and
    // one still being written are indistinguishable without it. Failed is stated for the same reason
    // one rung along — a run that could not happen writes no output, exactly as a quiet successful
    // one does.
    it('VALID: status => one phrase per end of the run', () => {
      expect(runConsoleStatics.status).toStrictEqual({
        running: 'Running…',
        finished: 'Finished',
        failed: 'Failed',
      });
    });

    it('VALID: statusColour => one colour per end of the run', () => {
      expect(runConsoleStatics.statusColour).toStrictEqual({
        running: 'yellow.5',
        finished: 'gray.4',
        failed: 'red.4',
      });
    });
  });

  describe('waiting vocabulary', () => {
    it('VALID: waitingMessage => names what is being waited on', () => {
      expect(runConsoleStatics.waitingMessage).toBe('Waiting for the CLI…');
    });

    // The console states the absence of output and points at the one surface holding the reason. It
    // must never carry the reason itself — that is the detail panel's, and a copy here would be the
    // same failure told twice.
    it('VALID: noOutputMessage => says the CLI wrote nothing and where the reason is', () => {
      expect(runConsoleStatics.noOutputMessage).toBe('The CLI wrote nothing — the Tests panel has the reason.');
    });
  });
});

import { runConsoleContract } from './run-console-contract';
import { RunConsoleStub } from './run-console.stub';

describe('runConsoleContract', () => {
  describe('valid consoles', () => {
    it('VALID: {stub default} => the report text a passing run wrote', () => {
      expect(String(RunConsoleStub())).toBe('src/a.ts  1/1 passed\n');
    });

    it('VALID: {a multi-line report} => parses verbatim, newlines intact', () => {
      const report = 'src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n    threw before reaching an exit: items.map is not a function\n';

      expect(String(runConsoleContract.parse(report))).toBe(report);
    });

    // Empty is a run that has written nothing YET, not a run that never happened — the panel showing
    // an empty console is the evidence a run is under way. "Never run" is undefined, and the two must
    // not collapse into one value.
    it('EMPTY: {an empty string} => parses, since a started run has written nothing yet', () => {
      expect(String(runConsoleContract.parse(''))).toBe('');
    });
  });

  describe('invalid consoles', () => {
    it('INVALID: {a number} => throws', () => {
      expect(() => {
        return runConsoleContract.parse(7 as never);
      }).toThrow(/Expected string/u);
    });
  });
});

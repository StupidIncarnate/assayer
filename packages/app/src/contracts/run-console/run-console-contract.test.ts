import { runConsoleContract } from './run-console-contract';
import { RunConsoleStub } from './run-console.stub';

describe('runConsoleContract', () => {
  describe('console text', () => {
    it('VALID: {stub default} => the CLI report verbatim', () => {
      expect(String(RunConsoleStub())).toBe('packages/a.ts  3/3 passed');
    });

    // The CLI's report is product surface an LLM acts on, so it must survive the boundary EXACTLY —
    // no trimming, no collapsing of the blank lines that separate a failure from its trace.
    it('VALID: {multi-line output with blank lines} => kept byte for byte', () => {
      expect(String(runConsoleContract.parse('a.ts  0/1 passed\n\n  expected 3\n'))).toBe(
        'a.ts  0/1 passed\n\n  expected 3\n',
      );
    });

    // A run that has started but written nothing yet HAS a console — an empty one. Rejecting it would
    // make the panel unable to say "running" until the first byte arrived.
    it('EMPTY: {no output yet} => an empty console, not a rejection', () => {
      expect(String(runConsoleContract.parse(''))).toBe('');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {a number} => throws', () => {
      expect(() => runConsoleContract.parse(123 as never)).toThrow(/expected string/iu);
    });
  });
});

import { runConsoleSaveBroker } from './run-console-save-broker';
import { runConsoleSaveBrokerProxy } from './run-console-save-broker.proxy';

describe('runConsoleSaveBroker', () => {
  describe('saving a report', () => {
    // Beside the run it narrates, in the run's OWN directory — so a run stays one directory a reader
    // can delete whole, rather than data here and its report somewhere else. The whole write list is
    // named, so a second file landing somewhere else fails this too.
    it('VALID: {a runId and its report} => written to console.txt inside that run directory, and nowhere else', async () => {
      const proxy = runConsoleSaveBrokerProxy();

      await runConsoleSaveBroker({ configDir: '/repo', runId: 'abc123', console: 'src/a.ts  1/1 passed\n' });

      expect(proxy.getWrittenPaths()).toStrictEqual(['/repo/.assayer/cache/runs/abc123/console.txt']);
    });

    // VERBATIM. The whole reason the text is stored rather than re-derived is that the desktop and a
    // human's terminal must not be able to disagree about what a run said, and any reshaping here —
    // trimming, re-wrapping, dropping a trailing newline — is the start of that disagreement.
    it('VALID: {a multi-line report} => stored byte-for-byte, not reformatted', async () => {
      const proxy = runConsoleSaveBrokerProxy();
      const report =
        'src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n    threw before reaching an exit: items.map is not a function\n';

      await runConsoleSaveBroker({ configDir: '/repo', runId: 'abc123', console: report });

      expect(String(proxy.getWrittenContentFor({ path: '/repo/.assayer/cache/runs/abc123/console.txt' }))).toBe(report);
    });

    // A file whose cases were ALL admitted never reaches the runner, so its run directory may not
    // exist — and that run's report is precisely the one that says why nothing ran.
    it('VALID: {a run whose directory does not exist yet} => creates it rather than failing the write', async () => {
      const proxy = runConsoleSaveBrokerProxy();

      await runConsoleSaveBroker({ configDir: '/repo', runId: 'abc123', console: 'src/a.ts  0/0 passed\n' });

      expect(proxy.getMkdirArgs({ path: '/repo/.assayer/cache/runs/abc123' })).toStrictEqual([
        '/repo/.assayer/cache/runs/abc123',
        { recursive: true },
      ]);
    });

    it('VALID: {a saved report} => returns success', async () => {
      runConsoleSaveBrokerProxy();

      const result = await runConsoleSaveBroker({ configDir: '/repo', runId: 'abc123', console: 'x' });

      expect(result).toBeUndefined();
    });

    // An empty report is a real value — a run that wrote nothing — and it must overwrite whatever the
    // previous run for these bytes left, never be skipped as "nothing to save".
    it('EMPTY: {an empty report} => still written, rather than skipped', async () => {
      const proxy = runConsoleSaveBrokerProxy();

      await runConsoleSaveBroker({ configDir: '/repo', runId: 'abc123', console: '' });

      expect(String(proxy.getWrittenContentFor({ path: '/repo/.assayer/cache/runs/abc123/console.txt' }))).toBe('');
    });
  });
});

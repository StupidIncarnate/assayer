import { runConsoleFindBroker } from './run-console-find-broker';
import { runConsoleFindBrokerProxy } from './run-console-find-broker.proxy';

describe('runConsoleFindBroker', () => {
  describe('a file whose last run left a report', () => {
    it('VALID: {a saved report for these bytes} => the report, verbatim', async () => {
      const proxy = runConsoleFindBrokerProxy();
      const report =
        'src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n    threw before reaching an exit: items.map is not a function\n';
      proxy.savedConsole({ console: report });

      const result = await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(String(result)).toBe(report);
    });

    // It reads the SOURCE first, and only to derive the content-keyed run id — which is what makes an
    // edited file miss its old report without any separate invalidation step to forget.
    it('VALID: {a saved report} => the source is read first, then the report inside that run directory', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.savedConsole({ console: 'src/a.ts  1/1 passed\n' });

      await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      // The run id is the REAL sha256 of `relPath\nsource` — the same one the runner names its
      // directory with, computed here from the same two facts rather than stubbed, so the reader and
      // the writer are proven to agree on where a report lives.
      expect(proxy.getReadArgs().map((args) => String(args))).toStrictEqual([
        '{"path":"/repo/src/a.ts"}',
        '{"path":"/repo/.assayer/cache/runs/c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931/console.txt"}',
      ]);
    });
  });

  describe('a file with no report for its current bytes', () => {
    // The wipe-on-edit path, and it is the same mechanism the verdicts use: the id moved with the
    // bytes, so the old report is simply not there. Undefined is what tells the desktop to show NO
    // console rather than the previous file's, or this file's from before the edit.
    it('EMPTY: {no report at that run id} => undefined', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.neverRun();

      const result = await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('a file that is not there', () => {
    it('EMPTY: {no such file} => undefined rather than a read error', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.fileMissing();

      const result = await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/gone.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('the source cannot be read', () => {
    it('ERROR: {fsReadFileAdapter rejects while reading the source} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.sourceReadThrows({ error: new Error('EACCES: permission denied') });

      await expect(
        runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
    });
  });

  describe('the console report cannot be read', () => {
    it('ERROR: {fsReadFileAdapter rejects while reading console.txt} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.consoleReadThrows({ error: new Error('EACCES: permission denied') });

      await expect(
        runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
    });
  });
});

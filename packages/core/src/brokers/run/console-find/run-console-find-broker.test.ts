import { runConsoleFindBroker } from './run-console-find-broker';
import { runConsoleFindBrokerProxy } from './run-console-find-broker.proxy';

const SOURCE_PATH = '/repo/src/a.ts';
const HARNESS_PATH = '/repo/src/a.harness.ts';
const SOURCE = 'export const a = 1;\n';
// The REAL sha256 of `relPath\nsource`, the same one the runner names its directory with, so the
// reader and the writer are proven to agree on where a report lives.
const RUN_ID = 'c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931';
const CONSOLE_PATH = `/repo/.assayer/cache/runs/${RUN_ID}/console.txt`;

describe('runConsoleFindBroker', () => {
  describe('a file whose last run left a report', () => {
    it('VALID: {a saved report for these bytes} => the report, verbatim', async () => {
      const proxy = runConsoleFindBrokerProxy();
      const report =
        'src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n    threw before reaching an exit: items.map is not a function\n';
      proxy.savedConsole({
        sourcePath: SOURCE_PATH,
        source: SOURCE,
        harnessPath: HARNESS_PATH,
        consolePath: CONSOLE_PATH,
        console: report,
      });

      const result = await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(String(result)).toBe(report);
    });

    // It reads the SOURCE only to derive the content-keyed run id, which is what makes an edited file
    // miss its old report without any separate invalidation step to forget. The report path is staged
    // under the real id of those bytes, so a wrong id reads nothing.
    it('VALID: {a saved report} => the source is read, then the report inside the run directory its bytes name', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.savedConsole({
        sourcePath: SOURCE_PATH,
        source: SOURCE,
        harnessPath: HARNESS_PATH,
        consolePath: CONSOLE_PATH,
        console: 'src/a.ts  1/1 passed\n',
      });

      await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect({
        source: proxy.getReadCalls({ path: SOURCE_PATH }),
        report: proxy.getReadCalls({ path: CONSOLE_PATH }),
      }).toStrictEqual({
        source: [[SOURCE_PATH, 'utf8']],
        report: [[CONSOLE_PATH, 'utf8']],
      });
    });
  });

  describe('a file with no report for its current bytes', () => {
    // The wipe-on-edit path, and it is the same mechanism the verdicts use: the id moved with the
    // bytes, so the old report is simply not there. Undefined is what tells the desktop to show NO
    // console rather than the previous file's, or this file's from before the edit.
    it('EMPTY: {no report at that run id} => undefined', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.neverRun({
        sourcePath: SOURCE_PATH,
        source: SOURCE,
        harnessPath: HARNESS_PATH,
        consolePath: CONSOLE_PATH,
      });

      const result = await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('a file that is not there', () => {
    it('EMPTY: {no such file} => undefined rather than a read error', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.fileMissing({ sourcePath: '/repo/src/gone.ts' });

      const result = await runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/gone.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('the source cannot be read', () => {
    it('ERROR: {reading the source is denied} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.sourceReadDenied({ sourcePath: SOURCE_PATH });

      await expect(
        runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' }),
      ).rejects.toThrow(/^EACCES: op '\/repo\/src\/a\.ts'$/u);
    });
  });

  describe('the console report cannot be read', () => {
    it('ERROR: {reading console.txt is denied} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runConsoleFindBrokerProxy();
      proxy.consoleReadDenied({
        sourcePath: SOURCE_PATH,
        source: SOURCE,
        harnessPath: HARNESS_PATH,
        consolePath: CONSOLE_PATH,
      });

      await expect(
        runConsoleFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' }),
      ).rejects.toThrow(
        /^EACCES: op '\/repo\/\.assayer\/cache\/runs\/c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931\/console\.txt'$/u,
      );
    });
  });
});

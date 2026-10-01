import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

import { runFindBroker } from './run-find-broker';
import { runFindBrokerProxy } from './run-find-broker.proxy';

// The REAL sha256 of `relPath\nsource` for src/a.ts, the id the runner names its directory with.
const RUN_ID = 'c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931';

describe('runFindBroker', () => {
  describe('a file that has been run', () => {
    it('VALID: {a saved run for these bytes} => the run', async () => {
      const proxy = runFindBrokerProxy();
      proxy.savedRun({
        sourcePath: '/repo/src/a.ts',
        harnessPath: '/repo/src/a.harness.ts',
        source: 'export const a = 1;\n',
        configDir: '/repo',
        runId: RUN_ID,
        run: RunResultStub(),
      });

      const result = await runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('a file that has not been run', () => {
    // "Not run" is an answer, not an error — the UI owes an empty state, not a failure.
    it('EMPTY: {no run for these bytes} => undefined', async () => {
      const proxy = runFindBrokerProxy();
      proxy.neverRun({
        sourcePath: '/repo/src/a.ts',
        harnessPath: '/repo/src/a.harness.ts',
        source: 'export const a = 1;\n',
        configDir: '/repo',
        runId: RUN_ID,
      });

      const result = await runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('a file that is not there', () => {
    it('EMPTY: {no such file} => undefined rather than a read error', async () => {
      const proxy = runFindBrokerProxy();
      proxy.fileMissing({ sourcePath: '/repo/src/gone.ts' });

      const result = await runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/gone.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('the source cannot be read', () => {
    it('ERROR: {relPath: file exists but reading it is denied with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runFindBrokerProxy();
      proxy.readDenied({ sourcePath: '/repo/src/a.ts' });

      await expect(
        runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' }),
      ).rejects.toThrow(/^EACCES: op '\/repo\/src\/a\.ts'$/u);
    });
  });
});

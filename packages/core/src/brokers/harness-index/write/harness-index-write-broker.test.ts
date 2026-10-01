import { HarnessIndexStub } from '@assayer/shared/contracts';

import { harnessIndexWriteBroker } from './harness-index-write-broker';
import { harnessIndexWriteBrokerProxy } from './harness-index-write-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('harnessIndexWriteBroker', () => {
  describe('writing a harness index for a namespace', () => {
    it('VALID: {configDir "/repo", namespace "feature-x", one harness} => writes the canonical index and returns success', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.succeeds();

      const result = await harnessIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: HarnessIndexStub(),
      });

      expect(result).toBeUndefined();
      expect(
        proxy.getWrittenIndex({ path: '/repo/.assayer/cache/harness/feature-x.json.tmp' }),
      ).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: EMPTY_HASH,
        harnesses: [
          { relPath: 'src/audit.harness.ts', targetRelPath: 'src/audit.ts', keys: [{ entry: 'audit', param: 'report' }] },
        ],
      });
    });

    it('VALID: {two harnesses out of path order} => writes them sorted by path (determinism)', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.succeeds();

      await harnessIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: HarnessIndexStub({
          harnesses: [
            { relPath: 'src/z.harness.ts', targetRelPath: 'src/z.ts', keys: [] },
            { relPath: 'src/a.harness.ts', targetRelPath: 'src/a.ts', keys: [] },
          ],
        }),
      });

      expect(
        proxy.getWrittenIndex({ path: '/repo/.assayer/cache/harness/feature-x.json.tmp' }),
      ).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: EMPTY_HASH,
        harnesses: [
          { relPath: 'src/a.harness.ts', targetRelPath: 'src/a.ts', keys: [] },
          { relPath: 'src/z.harness.ts', targetRelPath: 'src/z.ts', keys: [] },
        ],
      });
    });

    it('VALID: {keys out of order within one harness} => writes them sorted by entry then parameter', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.succeeds();

      await harnessIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: HarnessIndexStub({
          harnesses: [
            {
              relPath: 'src/audit.harness.ts',
              targetRelPath: 'src/audit.ts',
              keys: [
                { entry: 'collect', param: 'sink' },
                { entry: 'audit', param: 'write' },
                { entry: 'audit', param: 'report' },
              ],
            },
          ],
        }),
      });

      expect(
        proxy.getWrittenIndex({ path: '/repo/.assayer/cache/harness/feature-x.json.tmp' }),
      ).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: EMPTY_HASH,
        harnesses: [
          {
            relPath: 'src/audit.harness.ts',
            targetRelPath: 'src/audit.ts',
            keys: [
              { entry: 'audit', param: 'report' },
              { entry: 'audit', param: 'write' },
              { entry: 'collect', param: 'sink' },
            ],
          },
        ],
      });
    });

    it('EMPTY: {index.harnesses: []} => writes the canonical index with an empty harnesses array', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.succeeds();

      await harnessIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: HarnessIndexStub({ harnesses: [] }),
      });

      expect(
        proxy.getWrittenIndex({ path: '/repo/.assayer/cache/harness/feature-x.json.tmp' }),
      ).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        harnessHash: EMPTY_HASH,
        harnesses: [],
      });
    });

    it('VALID: {namespace "feature-x"} => writes to the tmp path under .assayer/cache/harness before renaming', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.succeeds();

      await harnessIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: HarnessIndexStub() });

      expect(proxy.getWrittenPaths()).toStrictEqual([
        '/repo/.assayer/cache/harness/feature-x.json.tmp',
      ]);
      expect(
        proxy.getRenameArgs({ from: '/repo/.assayer/cache/harness/feature-x.json.tmp' }),
      ).toStrictEqual([
        '/repo/.assayer/cache/harness/feature-x.json.tmp',
        '/repo/.assayer/cache/harness/feature-x.json',
      ]);
    });
  });

  describe('a failure along the mkdir -> write -> rename sequence', () => {
    it('ERROR: {harness cache dir cannot be created} => propagates the mkdir rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.mkdirThrows({ error: new Error('EACCES: permission denied') });

      await expect(
        harnessIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: HarnessIndexStub() }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
    });

    it('ERROR: {tmp harness index cannot be written} => propagates the write rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.writeThrows({ error: new Error('ENOSPC: no space left on device') });

      await expect(
        harnessIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: HarnessIndexStub() }),
      ).rejects.toThrow(/^ENOSPC: no space left on device$/u);
    });

    it('ERROR: {tmp harness index cannot be renamed into place} => propagates the rename rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = harnessIndexWriteBrokerProxy();
      proxy.renameThrows({ error: new Error('ENOENT: no such file or directory') });

      await expect(
        harnessIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: HarnessIndexStub() }),
      ).rejects.toThrow(/^ENOENT: no such file or directory$/u);
    });
  });
});

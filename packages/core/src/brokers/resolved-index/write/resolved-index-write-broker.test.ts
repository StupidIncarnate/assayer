import { ResolvedIndexStub } from '@assayer/shared/contracts';

import { resolvedIndexWriteBroker } from './resolved-index-write-broker';
import { resolvedIndexWriteBrokerProxy } from './resolved-index-write-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('resolvedIndexWriteBroker', () => {
  describe('writing a resolved index for a namespace', () => {
    it('VALID: {configDir "/repo", namespace "feature-x", one-edge index} => writes the canonical index and returns success', async () => {
      const proxy = resolvedIndexWriteBrokerProxy();
      proxy.succeeds();

      const result = await resolvedIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: ResolvedIndexStub(),
      });

      expect(result).toStrictEqual({ success: true });
      expect(
        proxy.getWrittenIndex({ path: '/repo/.assayer/cache/resolved/feature-x.json.tmp' }),
      ).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        edges: [
          {
            from: 'src/a/caller.ts',
            specifier: '../b/foo',
            importedName: 'foo',
            line: 1,
            column: 1,
            target: { kind: 'local', relPath: 'src/b/foo.ts' },
          },
        ],
      });
    });

    it('VALID: {namespace "feature-x"} => writes to the tmp path under .assayer/cache/resolved before renaming', async () => {
      const proxy = resolvedIndexWriteBrokerProxy();
      proxy.succeeds();

      await resolvedIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: ResolvedIndexStub() });

      expect(proxy.getWrittenPaths()).toStrictEqual([
        '/repo/.assayer/cache/resolved/feature-x.json.tmp',
      ]);
    });
  });

  describe('a failure along the mkdir -> write -> rename sequence', () => {
    it('ERROR: {resolved cache dir cannot be created} => propagates the mkdir rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = resolvedIndexWriteBrokerProxy();
      proxy.mkdirThrows({ error: new Error('EACCES: permission denied') });

      await expect(
        resolvedIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: ResolvedIndexStub() }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
    });

    it('ERROR: {tmp resolved index cannot be written} => propagates the write rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = resolvedIndexWriteBrokerProxy();
      proxy.writeThrows({ error: new Error('ENOSPC: no space left on device') });

      await expect(
        resolvedIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: ResolvedIndexStub() }),
      ).rejects.toThrow(/^ENOSPC: no space left on device$/u);
    });

    it('ERROR: {tmp resolved index cannot be renamed into place} => propagates the rename rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = resolvedIndexWriteBrokerProxy();
      proxy.renameThrows({ error: new Error('ENOENT: no such file or directory') });

      await expect(
        resolvedIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: ResolvedIndexStub() }),
      ).rejects.toThrow(/^ENOENT: no such file or directory$/u);
    });
  });
});

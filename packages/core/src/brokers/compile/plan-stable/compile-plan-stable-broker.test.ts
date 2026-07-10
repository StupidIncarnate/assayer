import { compilePlanStableBroker } from './compile-plan-stable-broker';
import { compilePlanStableBrokerProxy } from './compile-plan-stable-broker.proxy';

describe('compilePlanStableBroker', () => {
  describe('previousCommit matches the current commit', () => {
    it('VALID: {previousCommit: current commit sha} => returns mode "skipped" with no targets', async () => {
      const proxy = compilePlanStableBrokerProxy();
      const sha = '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2';
      proxy.resolvesUnchanged({ sha });

      const result = await compilePlanStableBroker({
        repoRoot: '/repo',
        ref: 'master',
        previousCommit: sha,
      });

      expect(result).toStrictEqual({ mode: 'skipped', targets: [] });
    });
  });

  describe('previousCommit is undefined (first-ever run)', () => {
    it('VALID: {previousCommit: undefined} => returns mode "net-new" with targets built from every non-excluded file at that ref', async () => {
      const proxy = compilePlanStableBrokerProxy();
      const sha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';
      proxy.resolvesChanged({
        sha,
        lsTreeStdout:
          '100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tpackages/shared/index.ts\n' +
          '100644 blob a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2\tpackages/shared/index.test.ts\n' +
          '100644 blob b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3\tpackages/web/app.tsx\n',
        fileContents: ['export const x = 1;\n', 'export const App = () => null;\n'],
      });

      const result = await compilePlanStableBroker({ repoRoot: '/repo', ref: 'master' });

      expect(result).toStrictEqual({
        mode: 'net-new',
        targets: [
          { relPath: 'packages/shared/index.ts', content: 'export const x = 1;\n' },
          { relPath: 'packages/web/app.tsx', content: 'export const App = () => null;\n' },
        ],
      });
    });
  });

  describe('previousCommit differs from the current commit', () => {
    it('VALID: {previousCommit: a different sha} => returns mode "incremental" with targets from the new ref\'s non-excluded files', async () => {
      const proxy = compilePlanStableBrokerProxy();
      const sha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';
      proxy.resolvesChanged({
        sha,
        lsTreeStdout:
          '100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tpackages/shared/index.ts\n' +
          '100644 blob a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2\tpackages/shared/index.test.ts\n' +
          '100644 blob b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3\tpackages/web/app.tsx\n',
        fileContents: ['export const x = 2;\n', 'export const App = () => "v2";\n'],
      });

      const result = await compilePlanStableBroker({
        repoRoot: '/repo',
        ref: 'master',
        previousCommit: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
      });

      expect(result).toStrictEqual({
        mode: 'incremental',
        targets: [
          { relPath: 'packages/shared/index.ts', content: 'export const x = 2;\n' },
          { relPath: 'packages/web/app.tsx', content: 'export const App = () => "v2";\n' },
        ],
      });
    });
  });
});

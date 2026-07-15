import { jestRunCliAdapter } from './jest-run-cli-adapter';
import { jestRunCliAdapterProxy } from './jest-run-cli-adapter.proxy';

describe('jestRunCliAdapter', () => {
  describe('the verdict it reports', () => {
    it('VALID: {every case reached its predicted exit} => success', async () => {
      const proxy = jestRunCliAdapterProxy();
      proxy.succeeds();

      const result = await jestRunCliAdapter({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        coreRoot: '/core',
        analyzerContentHash: 'abc123',
      });

      expect(result).toStrictEqual({ passed: true });
    });

    it('VALID: {a case reached the wrong exit} => failure', async () => {
      const proxy = jestRunCliAdapterProxy();
      proxy.fails();

      const result = await jestRunCliAdapter({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        coreRoot: '/core',
        analyzerContentHash: 'abc123',
      });

      expect(result).toStrictEqual({ passed: false });
    });
  });

  describe('the config it builds', () => {
    // The constraint that shapes the whole design: runCLI parses config as JSON, so the transformer
    // and setup file must be PATHS. That is why they exist as real files rather than live objects.
    it('VALID: {run args} => an inline JSON config naming the probe transformer and runtime by path', async () => {
      const proxy = jestRunCliAdapterProxy();

      await jestRunCliAdapter({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        coreRoot: '/core',
        analyzerContentHash: 'abc123',
      });

      expect(proxy.lastConfig()).toBe(
        JSON.stringify({
          rootDir: '/repo',
          roots: ['/cache/runs/r1'],
          testEnvironment: 'node',
          setupFiles: ['/core/probe-runtime.js'],
          testMatch: ['/cache/runs/r1/**/*.test.js'],
          transform: {
            '^.+\\.ts$': [
              'ts-jest',
              {
                diagnostics: false,
                astTransformers: {
                  before: [
                    {
                      path: '/core/probe-transformer.js',
                      // The analyzer's content hash rides in `options`, which ts-jest folds into its
                      // cache key — invalidation by CONTENT, never by a manual version bump.
                      options: { probeDir: '/cache/probes', analyzerContentHash: 'abc123' },
                    },
                  ],
                },
              },
            ],
          },
        }),
      );
    });
  });
});

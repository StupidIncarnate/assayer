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
          // The runs PARENT, not this run's own directory — see the pattern assertion below.
          roots: ['/cache/runs'],
          testEnvironment: 'node',
          setupFiles: ['/core/probe-runtime.js'],
          testMatch: ['/cache/runs/**/*.test.js'],
          // Empty by design: the runner's own pass/fail summary reaching a human leaks exactly the
          // surface this boundary exists to hide. The verdict is read back from the artifact.
          reporters: [],
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

    // THE memory invariant, and the reason the run's own directory is named as a pattern instead.
    // ts-jest keeps one TypeScript compiler per distinct config and never releases it, so a config
    // that named this run's directory made every file look like a new project and stranded a whole
    // compiler — ~370MB each, taking `assayer unit` over 13 files to 3GB, and OOM on a real repo.
    // Two files, one config: measured 3.0GB -> 0.8GB and 25s -> 8s across the catalogue.
    it('VALID: {two different runs} => the config is IDENTICAL, so ts-jest reuses one compiler', async () => {
      const proxy = jestRunCliAdapterProxy();

      await jestRunCliAdapter({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        coreRoot: '/core',
        analyzerContentHash: 'abc123',
      });
      const first = proxy.lastConfig();

      await jestRunCliAdapter({
        runDir: '/cache/runs/r2',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        coreRoot: '/core',
        analyzerContentHash: 'abc123',
      });

      expect(proxy.lastConfig()).toBe(first);
    });

    // Which run to execute travels in the test-path pattern, escaped because a run directory is a
    // path and the pattern is a regex — an unescaped `.` would match any character. The trailing
    // separator anchors it, so `r1` cannot select `r10`.
    it('VALID: {a run directory} => named as an escaped, separator-anchored test-path pattern', async () => {
      const proxy = jestRunCliAdapterProxy();

      await jestRunCliAdapter({
        runDir: '/cache/.assayer/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        coreRoot: '/core',
        analyzerContentHash: 'abc123',
      });

      expect(proxy.lastTestPathPatterns()).toStrictEqual(['/cache/\\.assayer/runs/r1/']);
    });
  });
});

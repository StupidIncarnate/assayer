import { CoreRuntimeStub } from '../../../contracts/core-runtime/core-runtime.stub';
import { runExecuteCasesBroker } from './run-execute-cases-broker';
import { runExecuteCasesBrokerProxy } from './run-execute-cases-broker.proxy';

describe('runExecuteCasesBroker', () => {
  describe('the verdict it reports', () => {
    it('VALID: {every case reached its predicted exit} => success', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      const result = await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
      });

      expect(result).toStrictEqual({ passed: true });
    });

    it('VALID: {a case reached the wrong exit} => failure', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.fails({ runDir: '/cache/runs/r1' });

      const result = await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
      });

      expect(result).toStrictEqual({ passed: false });
    });
  });

  describe('the config it builds', () => {
    // The constraint that shapes the whole design: runCLI parses config as JSON, so the transformer
    // and setup file must be PATHS. That is why they exist as real files rather than live objects.
    it('VALID: {a source runtime} => an inline JSON config naming the ceremony files by path, with the source condition on', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
      });

      expect(proxy.configFor({ testPathPattern: '/cache/runs/r1/' })).toBe(
        JSON.stringify({
          rootDir: '/repo',
          // The runs PARENT, not this run's own directory — see the pattern assertion below.
          roots: ['/cache/runs'],
          testEnvironment: 'node',
          // A source-tree run resolves a workspace package that core source imports to its TypeScript.
          testEnvironmentOptions: { customExportConditions: ['source', 'node', 'node-addons'] },
          // The setup file and the registrar read their module paths from this global.
          globals: {
            __assayerCoreRuntime: {
              tree: 'source',
              setupFile: '/core/probe-runtime.js',
              astTransformer: '/core/probe-transformer.js',
              registrar: '/core/harness-registrar.js',
              interpretCaseModule: '/core/src/brokers/case/interpret/case-interpret-broker',
              resolveEntryModule: '/core/src/brokers/case/resolve-entry/case-resolve-entry-broker',
              probeRuntimeModule: '/core/src/brokers/probe-runtime/create/probe-runtime-create-broker',
              probeInjectModule: '/core/src/transformers/probe-inject/probe-inject-transformer',
              harnessModule: '/core/index',
            },
          },
          setupFiles: ['/core/probe-runtime.js'],
          testMatch: ['/cache/runs/**/*.test.js'],
          // One mapped path is one module instance. Resolving `@assayer/core` from the harness and from
          // the shim can land on two installs in a workspace, and two instances mean a registration
          // nobody collected and every supplied input reported missing.
          moduleNameMapper: { '^@assayer/core$': '/core/harness-registrar.js' },
          // Empty by design: the runner's own pass/fail summary reaching a human leaks exactly the
          // surface this boundary exists to hide. The verdict is read back from the artifact.
          reporters: [],
          transform: {
            // ONE entry, and it selects `.tsx` as well as `.ts`. Both are analysed surface, so both
            // reach the runner as subjects; a `.tsx` no pattern claims arrives untransformed and dies
            // on its first type annotation. A second entry would be a second config key — and a second
            // ts-jest compiler — for a file the same compiler already handles.
            '^.+\\.tsx?$': [
              'ts-jest',
              {
                diagnostics: false,
                astTransformers: {
                  before: [
                    {
                      path: '/core/probe-transformer.js',
                      // The analyzer's content hash rides in `options`, which ts-jest folds into its
                      // cache key — invalidation by CONTENT, never by a manual version bump.
                      options: {
                        probeDir: '/cache/probes',
                        analyzerContentHash: 'abc123',
                        probeInjectModule: '/core/src/transformers/probe-inject/probe-inject-transformer',
                      },
                    },
                  ],
                },
              },
            ],
          },
        }),
      );
    });

    // A dist run is what a published install does. Its config sets no export condition, because a
    // published core ships no TypeScript for `source` to resolve to.
    it('VALID: {a dist runtime} => no testEnvironmentOptions key, and dist module paths', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub({
          tree: 'dist',
          interpretCaseModule: '/core/dist/src/brokers/case/interpret/case-interpret-broker',
          resolveEntryModule: '/core/dist/src/brokers/case/resolve-entry/case-resolve-entry-broker',
          probeRuntimeModule: '/core/dist/src/brokers/probe-runtime/create/probe-runtime-create-broker',
          probeInjectModule: '/core/dist/src/transformers/probe-inject/probe-inject-transformer',
          harnessModule: '/core/dist/index',
        }),
        analyzerContentHash: 'abc123',
      });

      expect(proxy.configFor({ testPathPattern: '/cache/runs/r1/' })).toBe(
        JSON.stringify({
          rootDir: '/repo',
          roots: ['/cache/runs'],
          testEnvironment: 'node',
          globals: {
            __assayerCoreRuntime: {
              tree: 'dist',
              setupFile: '/core/probe-runtime.js',
              astTransformer: '/core/probe-transformer.js',
              registrar: '/core/harness-registrar.js',
              interpretCaseModule: '/core/dist/src/brokers/case/interpret/case-interpret-broker',
              resolveEntryModule: '/core/dist/src/brokers/case/resolve-entry/case-resolve-entry-broker',
              probeRuntimeModule: '/core/dist/src/brokers/probe-runtime/create/probe-runtime-create-broker',
              probeInjectModule: '/core/dist/src/transformers/probe-inject/probe-inject-transformer',
              harnessModule: '/core/dist/index',
            },
          },
          setupFiles: ['/core/probe-runtime.js'],
          testMatch: ['/cache/runs/**/*.test.js'],
          moduleNameMapper: { '^@assayer/core$': '/core/harness-registrar.js' },
          reporters: [],
          transform: {
            '^.+\\.tsx?$': [
              'ts-jest',
              {
                diagnostics: false,
                astTransformers: {
                  before: [
                    {
                      path: '/core/probe-transformer.js',
                      options: {
                        probeDir: '/cache/probes',
                        analyzerContentHash: 'abc123',
                        probeInjectModule: '/core/dist/src/transformers/probe-inject/probe-inject-transformer',
                      },
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
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });
      proxy.succeeds({ runDir: '/cache/runs/r2' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
      });
      const first = proxy.configFor({ testPathPattern: '/cache/runs/r1/' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r2',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
      });

      expect(proxy.configFor({ testPathPattern: '/cache/runs/r2/' })).toBe(first);
    });

    // Which run to execute travels in the test-path pattern, escaped because a run directory is a
    // path and the pattern is a regex — an unescaped `.` would match any character. The trailing
    // separator anchors it, so `r1` cannot select `r10`.
    it('VALID: {a run directory} => named as an escaped, separator-anchored test-path pattern', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/.assayer/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/.assayer/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
      });

      expect(proxy.getTestPathPatterns()).toStrictEqual([['/cache/\\.assayer/runs/r1/']]);
    });
  });
});

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
        format: 'commonjs',
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
        format: 'commonjs',
      });

      expect(result).toStrictEqual({ passed: false });
    });

    it('ERROR: {Jest itself threw in the worker} => throws with the stack the worker sent back', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.crashes({ runDir: '/cache/runs/r1', stack: 'Error: Invalid testPattern\n    at runCLI' });

      await expect(
        runExecuteCasesBroker({
          runDir: '/cache/runs/r1',
          repoRoot: '/repo',
          probeDir: '/cache/probes',
          runtime: CoreRuntimeStub(),
          analyzerContentHash: 'abc123',
          format: 'commonjs',
        }),
      ).rejects.toThrow(
        /^assayer: the nested Jest threw before it reported a verdict\.\nError: Invalid testPattern\n {4}at runCLI$/u,
      );
    });
  });

  describe('the worker it runs in', () => {
    // Jest runs an ES module only through vm.SourceTextModule, which Node turns on only from the
    // worker's own command line.
    it('VALID: {an ESM run} => forks the runner entry with the vm-modules flag and its warning silenced', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
        format: 'esm',
      });

      expect(proxy.getForkCalls({ runner: '/core/run-jest.js' })).toStrictEqual([
        [
          '/core/run-jest.js',
          [],
          {
            execArgv: ['--experimental-vm-modules', '--no-warnings=ExperimentalWarning'],
            stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
          },
        ],
      ]);
    });

    // The vm-modules flag costs about 100 ms on every run, CommonJS runs included, so a CommonJS run
    // goes to a worker started without it. Same runner entry, same code path.
    it('VALID: {a CommonJS run} => forks the same runner entry with no Node flags', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
        format: 'commonjs',
      });

      expect(proxy.getForkCalls({ runner: '/core/run-jest.js' })).toStrictEqual([
        [
          '/core/run-jest.js',
          [],
          {
            execArgv: [],
            stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
          },
        ],
      ]);
    });
  });

  describe('the config it builds', () => {
    // The constraint that shapes the whole design: Jest parses config as JSON, so the transformer,
    // setup file and resolver must be PATHS. That is why they exist as real files rather than live objects.
    it('VALID: {a CommonJS file, a source runtime} => a .cjs test file, the setup file, the commonjs override and the source condition', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
        format: 'commonjs',
      });

      expect(proxy.requestFor({ testPathPattern: '/cache/runs/r1/' })).toStrictEqual({
        config: JSON.stringify({
          rootDir: '/repo',
          // The runs PARENT, not this run's own directory — see the pattern assertion below.
          roots: ['/cache/runs'],
          testEnvironment: 'node',
          // A source-tree run resolves a workspace package that core source imports to its TypeScript.
          testEnvironmentOptions: { customExportConditions: ['source', 'node', 'node-addons'] },
          // The setup file reads its module path from this global.
          globals: { __assayerCoreRuntime: CoreRuntimeStub() },
          setupFiles: ['/core/probe-runtime.js'],
          // The extension fixes the format, so a consumer's package.json `type` never decides it.
          testMatch: ['/cache/runs/**/assayer.test.cjs'],
          // Resolves `./band.js` to `band.ts`, the way TypeScript does.
          resolver: '/core/ts-resolver.js',
          // One mapped path is one module instance. Resolving `@assayer/core` from the harness and from
          // the shim can land on two installs in a workspace, and two instances mean a registration
          // nobody collected and every supplied input reported missing.
          moduleNameMapper: { '^@assayer/core$': '/core/harness-registrar.js' },
          // Empty by design: the runner's own pass/fail summary reaching a human leaks exactly the
          // surface this boundary exists to hide. The verdict is read back from the artifact.
          reporters: [],
          transform: {
            // ONE entry, and it selects `.tsx` as well as `.ts`. A second entry would be a second config
            // key, and a second ts-jest compiler, for a file the same compiler already handles.
            '^.+\\.tsx?$': [
              'ts-jest',
              {
                // ts-jest compiles with the TypeScript ts-morph bundles, the copy that recorded the
                // probe offsets.
                compiler: '/core/bundled-typescript.js',
                // Each file compiles on its own, so ts-jest builds no type-checked program of the
                // consumer's repo. Not a node module kind, which keeps ts-jest off the transpile path that
                // ignores `compiler`.
                tsconfig: { module: 'commonjs', isolatedModules: true },
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
        testPathPattern: '/cache/runs/r1/',
        rootDir: '/repo',
        tree: 'source',
      });
    });

    // An ESM file runs as ESM: a .mjs test file, TypeScript sources loaded as ES modules, ts-jest in its
    // ESM mode with an esnext override. No setup file, because the ESM test file installs the probe
    // runtime itself.
    it('VALID: {an ESM file, a source runtime} => a .mjs test file, no setup file, the ESM extensions and the esnext override', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime: CoreRuntimeStub(),
        analyzerContentHash: 'abc123',
        format: 'esm',
      });

      expect(proxy.configFor({ testPathPattern: '/cache/runs/r1/' })).toBe(
        JSON.stringify({
          rootDir: '/repo',
          roots: ['/cache/runs'],
          testEnvironment: 'node',
          testEnvironmentOptions: { customExportConditions: ['source', 'node', 'node-addons'] },
          globals: { __assayerCoreRuntime: CoreRuntimeStub() },
          setupFiles: [],
          testMatch: ['/cache/runs/**/assayer.test.mjs'],
          extensionsToTreatAsEsm: ['.ts', '.tsx'],
          resolver: '/core/ts-resolver.js',
          moduleNameMapper: { '^@assayer/core$': '/core/harness-registrar.js' },
          reporters: [],
          transform: {
            '^.+\\.tsx?$': [
              'ts-jest',
              {
                compiler: '/core/bundled-typescript.js',
                tsconfig: { module: 'esnext', esModuleInterop: true, isolatedModules: true },
                useESM: true,
                diagnostics: false,
                astTransformers: {
                  before: [
                    {
                      path: '/core/probe-transformer.js',
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
    it('VALID: {a dist runtime} => no testEnvironmentOptions key, dist module paths, and the dist tree named to the worker', async () => {
      const proxy = runExecuteCasesBrokerProxy();
      proxy.succeeds({ runDir: '/cache/runs/r1' });
      const runtime = CoreRuntimeStub({
        tree: 'dist',
        interpretCaseModule: '/core/dist/src/brokers/case/interpret/case-interpret-broker',
        resolveEntryModule: '/core/dist/src/brokers/case/resolve-entry/case-resolve-entry-broker',
        probeRuntimeModule: '/core/dist/src/brokers/probe-runtime/create/probe-runtime-create-broker',
        probeInjectModule: '/core/dist/src/transformers/probe-inject/probe-inject-transformer',
        harnessModule: '/core/dist/index',
      });

      await runExecuteCasesBroker({
        runDir: '/cache/runs/r1',
        repoRoot: '/repo',
        probeDir: '/cache/probes',
        runtime,
        analyzerContentHash: 'abc123',
        format: 'commonjs',
      });

      expect(proxy.requestFor({ testPathPattern: '/cache/runs/r1/' })).toStrictEqual({
        config: JSON.stringify({
          rootDir: '/repo',
          roots: ['/cache/runs'],
          testEnvironment: 'node',
          globals: { __assayerCoreRuntime: runtime },
          setupFiles: ['/core/probe-runtime.js'],
          testMatch: ['/cache/runs/**/assayer.test.cjs'],
          resolver: '/core/ts-resolver.js',
          moduleNameMapper: { '^@assayer/core$': '/core/harness-registrar.js' },
          reporters: [],
          transform: {
            '^.+\\.tsx?$': [
              'ts-jest',
              {
                compiler: '/core/bundled-typescript.js',
                tsconfig: { module: 'commonjs', isolatedModules: true },
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
        testPathPattern: '/cache/runs/r1/',
        rootDir: '/repo',
        tree: 'dist',
      });
    });

    // THE memory invariant, and the reason the run's own directory is named as a pattern instead.
    // ts-jest keeps one TypeScript compiler per distinct config and never releases it, so a config
    // that named this run's directory made every file look like a new project and stranded a whole
    // compiler — ~370MB each, taking `assayer unit` over 13 files to 3GB, and OOM on a real repo.
    // Two files, one config: measured 3.0GB -> 0.8GB and 25s -> 8s across the catalogue.
    it.each(['commonjs', 'esm'] as const)(
      'VALID: {two different %s runs} => the config is IDENTICAL, so ts-jest reuses one compiler',
      async (format) => {
        const proxy = runExecuteCasesBrokerProxy();
        proxy.succeeds({ runDir: '/cache/runs/r1' });
        proxy.succeeds({ runDir: '/cache/runs/r2' });

        await runExecuteCasesBroker({
          runDir: '/cache/runs/r1',
          repoRoot: '/repo',
          probeDir: '/cache/probes',
          runtime: CoreRuntimeStub(),
          analyzerContentHash: 'abc123',
          format,
        });
        const first = proxy.configFor({ testPathPattern: '/cache/runs/r1/' });

        await runExecuteCasesBroker({
          runDir: '/cache/runs/r2',
          repoRoot: '/repo',
          probeDir: '/cache/probes',
          runtime: CoreRuntimeStub(),
          analyzerContentHash: 'abc123',
          format,
        });

        expect(proxy.configFor({ testPathPattern: '/cache/runs/r2/' })).toBe(first);
      },
    );

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
        format: 'commonjs',
      });

      expect(proxy.getTestPathPatterns()).toStrictEqual(['/cache/\\.assayer/runs/r1/']);
    });
  });
});

/**
 * PURPOSE: Runs Jest over an assembled run directory — the ONE place Assayer's wrapped runner is
 *   actually invoked. Consumers never touch Jest; the runner is an implementation detail behind this
 *   boundary, which is what keeps it swappable.
 *
 *   Jest runs in a worker process, the one `forkWorker` keeps alive per batch, started with
 *   `coreRuntimeStatics.workerExecArgv`. The worker needs `--experimental-vm-modules` so an ESM consumer's
 *   code runs as ES modules, and only a process's own command line can turn that flag on. Every run, ESM
 *   and CommonJS alike, goes through the same worker, so there is one execution path. The worker's entry
 *   is the root `run-jest.js`, and it replies `{ passed }`, or `{ crashed }` when Jest itself throws.
 *
 *   The config is INLINE JSON, which constrains the shape: Jest parses it as JSON, so the transformer,
 *   setup file, resolver, environment and compiler must be file PATHS, never live objects. The ceremony
 *   files at core's package root are those paths. `bundled-typescript.js` is ts-jest's `compiler`: the
 *   TypeScript ts-morph bundles. `ts-resolver.js` resolves an import the way TypeScript does, so a
 *   `./band.js` import finds `band.ts`.
 *
 *   `format` is the consumer file's module format, from `moduleFormatReadBroker`. It picks the generated
 *   test file's extension, the ts-jest `module` override, and for ESM, `useESM` with the extensions Jest
 *   loads as ES modules. Neither override is a node module kind, so ts-jest always compiles with
 *   `compiler`. A CommonJS run keeps `probe-runtime.js` as its setup file. An ESM run has none: a setup
 *   file is CommonJS, and in an ESM run of core's source it cannot `require` core's TypeScript, so the ESM
 *   test file installs the probe runtime itself before it loads the subject.
 *
 *   `runtime` says which tree core's typed modules come from. The `__assayerCoreRuntime` Jest global
 *   carries the whole object to the setup file, and the transformer's `options` carry
 *   `probeInjectModule`. A source-tree run also sets the `source` export condition, so a workspace
 *   package that core source imports resolves to its TypeScript too.
 *
 *   `options.analyzerContentHash` is not decoration. ts-jest folds transformer options into its cache
 *   key, so a change to the analyzer invalidates instrumented output BY CONTENT — never by the manual
 *   `version` bump ts-jest's own transformers use, which is the mechanism this project ruled against.
 *
 *   `@assayer/core` is MAPPED to the run-side harness registrar, which is what makes a colocated
 *   harness's registration reach the shim that loaded it. Resolving the package from the harness and
 *   from the shim can land on two installs in a workspace, and two module instances mean a declaration
 *   nobody collected and every supplied input reported missing; one mapped path is one instance. The
 *   mapping is exact — a subpath (`@assayer/core/contracts`) is Assayer's own plumbing and is left alone.
 *
 *   The config is IDENTICAL for every file of one format, and the run's own directory is named as a
 *   test-path PATTERN instead. That is load-bearing, not tidiness. ts-jest keeps one TypeScript compiler
 *   per distinct config and never releases it, so pointing `roots`/`testMatch` at each run's own
 *   directory made every file look like a new project and left a whole compiler behind — measured at
 *   ~370MB per file, which took `assayer unit` over 13 files to 3GB and would OOM a real repo. One
 *   config per format means at most two compilers in the worker, each reused.
 *
 * USAGE:
 * runExecuteCasesBroker({ runDir, repoRoot, probeDir, runtime, analyzerContentHash, format: 'esm' });
 * // Returns { passed: true } when every generated case reached the exit derivation predicted
 */
import { forkWorker } from '#gateway/node/child_process';
import { dirname } from '#gateway/node/path';
import { z } from '#gateway/npm/zod';

import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import { testPathPatternTransformer } from '../../../transformers/test-path-pattern/test-path-pattern-transformer';
import { runVerdictContract } from '../../../contracts/run-verdict/run-verdict-contract';
import type { RunVerdict } from '../../../contracts/run-verdict/run-verdict-contract';
import type { CoreRuntime } from '../../../contracts/core-runtime/core-runtime-contract';

const workerReplyContract = z.union([
  z.object({ passed: z.boolean() }),
  z.object({ crashed: z.string().brand<'WorkerReplyCrashed'>() }),
]);

export const runExecuteCasesBroker = async ({
  runDir,
  repoRoot,
  probeDir,
  runtime,
  analyzerContentHash,
  format,
}: {
  runDir: string;
  repoRoot: string;
  probeDir: string;
  runtime: CoreRuntime;
  analyzerContentHash: string;
  format: (typeof coreRuntimeStatics.moduleFormats)[number];
}): Promise<RunVerdict> => {
  // The runs PARENT, shared by every file, so the config below never varies between them.
  const runsRoot = dirname(runDir);
  const esm = format === 'esm';
  const config = {
    rootDir: repoRoot,
    roots: [runsRoot],
    testEnvironment: 'node',
    // Source tree only. A dist run is what a published install does, and a published core ships no
    // TypeScript for a `source` condition to resolve to.
    ...(runtime.tree === 'source'
      ? { testEnvironmentOptions: { customExportConditions: [...coreRuntimeStatics.sourceExportConditions] } }
      : {}),
    globals: { [coreRuntimeStatics.jestGlobal.name]: runtime },
    setupFiles: esm ? [] : [runtime.setupFile],
    testMatch: [`${runsRoot}/**/${coreRuntimeStatics.shimFile[format]}`],
    ...(esm ? { extensionsToTreatAsEsm: [...coreRuntimeStatics.esmExtensions] } : {}),
    resolver: runtime.resolver,
    moduleNameMapper: { '^@assayer/core$': runtime.registrar },
    // No reporters at all: the runner is an implementation detail, and its pass/fail summary reaching
    // a human is a leak of exactly the surface this boundary exists to hide. The verdict is read back
    // from the artifact, so nothing here needs to print.
    reporters: [],
    transform: {
      // ONE entry covering both TypeScript extensions. A `.tsx` entry is analysed surface like any
      // other, so the pattern that selects the subject has to reach it — and the widening is what keeps
      // that true without a second entry, which would be a second config key and a second compiler.
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          // The copy ts-morph bundles, so the compiler that places each probe parses with the same
          // TypeScript that recorded the probe offsets.
          compiler: runtime.compiler,
          // Merged over the consumer's tsconfig. Never a node module kind, which with `isolatedModules`
          // sends ts-jest to a transpile path that ignores `compiler`.
          tsconfig: coreRuntimeStatics.tsJestCompilerOptions[format],
          ...(esm ? { useESM: true } : {}),
          diagnostics: false,
          astTransformers: {
            before: [
              {
                path: runtime.astTransformer,
                options: { probeDir, analyzerContentHash, probeInjectModule: runtime.probeInjectModule },
              },
            ],
          },
        },
      ],
    },
  };

  const reply = workerReplyContract.parse(
    await forkWorker({ modulePath: runtime.runner, execArgv: [...coreRuntimeStatics.workerExecArgv] }).request({
      message: {
        config: JSON.stringify(config),
        // The one place THIS run is named, which is what lets the config above stay identical between runs.
        testPathPattern: testPathPatternTransformer({ runDir }),
        rootDir: repoRoot,
        tree: runtime.tree,
      },
    }),
  );

  if ('crashed' in reply) {
    throw new Error(`assayer: the nested Jest threw before it reported a verdict.\n${String(reply.crashed)}`);
  }

  return runVerdictContract.parse({ passed: reply.passed });
};

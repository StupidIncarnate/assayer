import { analyzeFileBrokerProxy } from '@assayer/core/brokers/analyze/file/analyze-file-broker.proxy';
import { fileWalkBrokerProxy } from '@assayer/core/brokers/file/walk/file-walk-broker.proxy';
import { runUnitBrokerProxy } from '@assayer/core/brokers/run/unit/run-unit-broker.proxy';

import { createHash } from '#gateway/node/crypto';
import { ensureDirSyncProxy } from '#gateway/node/fs/ensure-dir-sync/ensure-dir-sync.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { rmSyncProxy } from '#gateway/node/fs/rm-sync/rm-sync.proxy';
import { tmpdir } from '#gateway/node/os';
import { basename, dirname, extname, join, resolve } from '#gateway/node/path';
import { pid } from '#gateway/node/process';
import { pidProxy } from '#gateway/node/process/pid/pid.proxy';

import { observeStatics } from '../../../statics/observe/observe-statics';

export const specimenObserveBrokerProxy = (): {
  // The specimen is on disk with this text, the cache folder can be emptied and recreated, and the
  // run writes its files and saves `run` as its result under `runId`. The target has no tsconfig and
  // no colocated harness, and runs as CommonJS.
  setupObservedRun: ({
    repoRoot,
    relPath,
    source,
    runId,
    run,
  }: {
    repoRoot: string;
    relPath: string;
    source: string;
    runId: string;
    run: unknown;
  }) => void;
  setupMissingSource: ({ repoRoot, relPath }: { repoRoot: string; relPath: string }) => void;
  // The cache folder the broker uses in this process.
  cacheDir: () => string;
  // Every call that emptied or created the cache folder, as the file system received it.
  cacheDirCalls: () => { removed: unknown[][]; created: unknown[][] };
  // Every file the run wrote under the cache folder, in call order.
  writtenPaths: () => unknown[];
  // The text of the test file the run generated for Jest.
  writtenShim: () => string;
} => {
  const sourceReads = readFileSyncProxy();
  const removals = rmSyncProxy();
  const dirs = ensureDirSyncProxy();
  analyzeFileBrokerProxy();
  fileWalkBrokerProxy();
  const run = runUnitBrokerProxy({ coreRoot: resolve(__dirname, ...observeStatics.corePathSegments) });
  pidProxy();
  const cacheDir = join(tmpdir(), `${observeStatics.cache.dirPrefix}${String(pid)}`);

  return {
    setupObservedRun: ({
      repoRoot,
      relPath,
      source,
      runId,
      run: savedRun,
    }: {
      repoRoot: string;
      relPath: string;
      source: string;
      runId: string;
      run: unknown;
    }): void => {
      const absPath = join(repoRoot, relPath);
      sourceReads.returns({ path: absPath, contents: source });
      removals.succeeds({ path: cacheDir });
      dirs.succeeds({ path: cacheDir });
      run.setupWrites({
        cacheDir,
        runId,
        contentHash: createHash('sha256').update(source, 'utf8').digest('hex'),
        repoRoot,
        absPath,
      });
      run.setupNoHarness({ path: join(dirname(absPath), `${basename(absPath, extname(absPath))}.harness.ts`) });
      run.setupSavedRun({ cacheDir, runId, run: savedRun });
    },
    setupMissingSource: ({ repoRoot, relPath }: { repoRoot: string; relPath: string }): void => {
      const path = join(repoRoot, relPath);
      sourceReads.throws({ path, error: FileMissingErrorStub({ path }) });
    },
    cacheDir: (): string => cacheDir,
    cacheDirCalls: (): { removed: unknown[][]; created: unknown[][] } => ({
      removed: removals.calls({ path: cacheDir }),
      created: dirs.calls({ path: cacheDir }),
    }),
    writtenPaths: (): unknown[] => run.writtenPaths({ cacheDir }),
    writtenShim: (): string =>
      String(run.writtenContentFor({ cacheDir, pathIncludes: 'assayer.test.cjs' })),
  };
};

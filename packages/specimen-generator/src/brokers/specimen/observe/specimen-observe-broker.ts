/**
 * PURPOSE: Runs the real Assayer on one specimen file and reports what it found as a
 * SpecimenOutcome. A generated test calls this and compares the result with the outcome the
 * generator predicted from its configs. This file and specimenOutcomeProjectionTransformer are the
 * only two in the package that may use Assayer, so the prediction side can never read Assayer.
 *
 * The cache folder is the same path for every call in one process. The nested Jest run keeps one
 * TypeScript compiler for each distinct config path, so a fresh folder per call kept a new compiler
 * alive each time and ran the process out of memory. The folder is emptied before each call
 * instead. The run id comes from the file's own path, so one file always gets the same run id.
 *
 * USAGE:
 * await specimenObserveBroker({ repoRoot: '/repo/smoke-repo', relPath: 'packages/syntax-repository/src/if/a/a.ts' });
 * // Returns a SpecimenOutcome built from Assayer's analysis and run of that file
 */
import { analyzeFileBroker, fileWalkBroker, runUnitBroker } from '@assayer/core/brokers';

import { ensureDirSync, readFileSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join, resolve } from '#gateway/node/path';
import { pid } from '#gateway/node/process';

import type { SpecimenOutcome } from '../../../contracts/specimen-outcome/specimen-outcome-contract';
import { observeStatics } from '../../../statics/observe/observe-statics';
import { specimenOutcomeProjectionTransformer } from '../../../transformers/specimen-outcome-projection/specimen-outcome-projection-transformer';

export const specimenObserveBroker = async ({
  repoRoot,
  relPath,
}: {
  repoRoot: string;
  relPath: string;
}): Promise<SpecimenOutcome> => {
  const absPath = join(repoRoot, relPath);
  const source = readFileSync(absPath);

  const walked = fileWalkBroker({ source, relPath, absPath });
  const analysis = analyzeFileBroker({ walked, relPath });

  const cacheDir = join(tmpdir(), `${observeStatics.cache.dirPrefix}${String(pid)}`);
  rmSync(cacheDir, { recursive: true, force: true });
  ensureDirSync(cacheDir);

  const run = await runUnitBroker({
    cacheDir,
    coreRoot: resolve(__dirname, ...observeStatics.corePathSegments),
    repoRoot,
    relPath,
    absPath,
    source,
    runId: relPath.replaceAll('/', '__'),
    analyzerContentHash: observeStatics.cache.analyzerContentHash,
  });

  return specimenOutcomeProjectionTransformer({ analysis, run });
};

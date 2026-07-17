/**
 * PURPOSE: Runs the derived cases for one file and returns the saved result — the single execution
 *   path, which BOTH the CLI and the desktop go through.
 *
 *   That singularity is the design, not an implementation detail: "run in the UI" and "run headless"
 *   cannot drift because they are not two runners, they are one broker producing one artifact that
 *   two surfaces read.
 *
 *   A case set with NO drivable entries never reaches Jest. There is nothing for it to discover, so
 *   invoking it can only fail — it refuses a suite with no `it()`, its `afterAll` never runs, and the
 *   artifact everything downstream reads is never written. The honest artifact is written here
 *   instead, and it is not empty: the file's logic is admitted on `undriven`. The alternative — a
 *   placeholder `it()` to keep Jest happy — is a fake passing test, which is the exact "reads as
 *   complete" lie this whole pipeline exists to refuse. Skipping the runner is also just faster: no
 *   compiler starts for a file with nothing to run.
 *
 *   The ORDER matters. The probe plan must be on disk before Jest starts, because the transformer
 *   looks it up by content hash while compiling — and a missing plan means "not part of the analyzed
 *   surface", which is silently correct for a dependency and silently wrong for a target. The run
 *   result is then read back from the artifact the shim wrote rather than from Jest's own reporting,
 *   so raw runner output never reaches a human.
 *
 * USAGE:
 * await runUnitBroker({ cacheDir, coreRoot, repoRoot, relPath, absPath, source, runId, analyzerContentHash });
 * // Returns { runId, relPath, cases: [{ status, observedExit, trace }], gaps, darkSpots, undriven }
 */
import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { jestRunCliAdapter } from '../../../adapters/jest/run-cli/jest-run-cli-adapter';
import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { assembleShimTransformer } from '../../../transformers/assemble-shim/assemble-shim-transformer';
import { caseSetProjectionTransformer } from '../../../transformers/case-set-projection/case-set-projection-transformer';
import { probePlanProjectionTransformer } from '../../../transformers/probe-plan-projection/probe-plan-projection-transformer';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';

export const runUnitBroker = async ({
  cacheDir,
  coreRoot,
  repoRoot,
  relPath,
  absPath,
  source,
  runId,
  analyzerContentHash,
}: {
  cacheDir: string;
  coreRoot: string;
  repoRoot: string;
  relPath: string;
  absPath: string;
  source: string;
  runId: string;
  analyzerContentHash: string;
}): Promise<RunResult> => {
  const walked = tsMorphWalkFileAdapter({ source, relPath });
  const analysis = analyzeFileBroker({ walked });
  const contentHash = cryptoSha256Adapter({ content: source });

  const probeDir = `${cacheDir}/probes`;
  const runDir = `${cacheDir}/runs/${runId}`;
  const caseSetPath = `${runDir}/cases.json`;
  const resultPath = `${runDir}/run.json`;
  const caseSet = caseSetProjectionTransformer({ analysis, relPath, modulePath: absPath });

  await fsMkdirAdapter({ path: probeDir });
  await fsMkdirAdapter({ path: runDir });

  await fsWriteFileAdapter({ path: caseSetPath, content: JSON.stringify(caseSet) });

  // Nothing to discover means nothing to run: Jest refuses a suite with no `it()`, so handing it this
  // file could only fail. The artifact is written here instead — with every admission intact, because
  // "no drivable case" is a FINDING about the file, not an absence of one.
  if (caseSet.entries.length === 0) {
    const result = runResultContract.parse({
      runId,
      relPath,
      cases: [],
      gaps: caseSet.gaps,
      darkSpots: caseSet.darkSpots,
      undriven: caseSet.undriven,
    });

    await fsWriteFileAdapter({ path: resultPath, content: JSON.stringify(result) });

    return result;
  }

  // Written FIRST and keyed by content hash: the transformer looks the plan up while compiling, so a
  // stale read is unrepresentable rather than merely unlikely.
  await fsWriteFileAdapter({
    path: `${probeDir}/${contentHash}.json`,
    content: JSON.stringify(probePlanProjectionTransformer({ walked, relPath, contentHash })),
  });

  await fsWriteFileAdapter({
    path: `${runDir}/assayer.test.js`,
    content: assembleShimTransformer({
      caseSetPath,
      adaptersPath: `${coreRoot}/dist/adapters`,
      resultPath,
      runId,
    }),
  });

  await jestRunCliAdapter({ runDir, repoRoot, probeDir, coreRoot, analyzerContentHash });

  // A FAILING case still writes the artifact — the shim's afterAll sees to that — so a missing one
  // means the runner itself died and the run is over with nothing to report. Said plainly here rather
  // than surfaced as an ENOENT on a cache path nobody chose to care about: the reader's file is fine,
  // Assayer's runner is not, and only one of those is actionable.
  if (!(await fsExistsAdapter({ path: resultPath }))) {
    throw new Error(
      `assayer: the runner crashed while running ${relPath} and wrote no result.\n` +
        `  ${String(caseSet.entries.length)} drivable entr${caseSet.entries.length === 1 ? 'y was' : 'ies were'} ` +
        'handed to Jest, which exited without recording a verdict for any of them. That is a fault in ' +
        'Assayer, not a failing test in your code.\n' +
        `  The generated shim and the cases it was given are on disk at ${runDir} — running Jest against ` +
        'that directory reproduces the crash. Please report it with that output.',
    );
  }

  // Read back the ARTIFACT, not Jest's reporting: the verdict is already in it, and raw runner output
  // is never what a human sees.
  return runResultContract.parse(JSON.parse(await fsReadFileAdapter({ path: resultPath })));
};

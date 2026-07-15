/**
 * PURPOSE: Runs the derived cases for one file and returns the saved result — the single execution
 *   path, which BOTH the CLI and the desktop go through.
 *
 *   That singularity is the design, not an implementation detail: "run in the UI" and "run headless"
 *   cannot drift because they are not two runners, they are one broker producing one artifact that
 *   two surfaces read.
 *
 *   The ORDER matters. The probe plan must be on disk before Jest starts, because the transformer
 *   looks it up by content hash while compiling — and a missing plan means "not part of the analyzed
 *   surface", which is silently correct for a dependency and silently wrong for a target. The run
 *   result is then read back from the artifact the shim wrote rather than from Jest's own reporting,
 *   so raw runner output never reaches a human.
 *
 * USAGE:
 * await runUnitBroker({ cacheDir, coreRoot, repoRoot, relPath, absPath, source, runId, analyzerContentHash });
 * // Returns { runId, relPath, cases: [{ status, observedExit, trace }] }
 */
import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
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

  await fsMkdirAdapter({ path: probeDir });
  await fsMkdirAdapter({ path: runDir });

  // Written FIRST and keyed by content hash: the transformer looks the plan up while compiling, so a
  // stale read is unrepresentable rather than merely unlikely.
  await fsWriteFileAdapter({
    path: `${probeDir}/${contentHash}.json`,
    content: JSON.stringify(probePlanProjectionTransformer({ walked, relPath, contentHash })),
  });

  await fsWriteFileAdapter({
    path: caseSetPath,
    content: JSON.stringify(caseSetProjectionTransformer({ analysis, relPath, modulePath: absPath })),
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

  // Read back the ARTIFACT, not Jest's reporting: the verdict is already in it, and raw runner output
  // is never what a human sees.
  return runResultContract.parse(JSON.parse(await fsReadFileAdapter({ path: resultPath })));
};

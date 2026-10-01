/**
 * PURPOSE: Writes the probe plan for every SIBLING a cross-file-map fold reaches, so the imported
 *   callee is INSTRUMENTED at run time and its exits fire into the shared `__P`. When a surface maps an
 *   imported function (`items.map(bandReading)`), the folded cases predict a path through the sibling's
 *   OWN exits — but ts-jest only instruments a file whose probe plan is already on disk, keyed by that
 *   file's content hash. The per-file run writes only the target's plan; this writes each mapped
 *   sibling's plan beside it, keyed on the SAME bytes ts-jest hashes, so the sibling's exit probes are
 *   observable exactly as an inline callback's are.
 *
 *   It instruments ONLY the siblings a fold actually threads through — never every import — because a
 *   file's module-completion probe id is shared across files, and instrumenting an unrelated import
 *   could surface one file's module exit as another's. A mapped callee's FUNCTION exits carry the
 *   callee's own coverage ids, which the folded case predicts and the interpreter observes; its module
 *   exit is filtered out, absent from the host entry's observed exit set. Reads the SAME reaches the
 *   fold overlay does, so what is made observable and what is folded cannot drift. A file with no
 *   cross-file-map reach writes nothing. Returns the sibling relPaths it instrumented.
 *
 * USAGE:
 * await runCrossFileProbesBroker({ walked, root: '/repo', relPath: 'src/cross-file-map.ts', probeDir: '/repo/.assayer/cache/probes' });
 * // Writes '<probeDir>/<siblingContentHash>.json' for each mapped imported callee, returns ['src/band-reading.ts']
 */

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { tsconfigReadBroker } from '../../tsconfig/read/tsconfig-read-broker';
import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { crossFileMapReachesTransformer } from '../../../transformers/cross-file-map-reaches/cross-file-map-reaches-transformer';
import { probePlanProjectionTransformer } from '../../../transformers/probe-plan-projection/probe-plan-projection-transformer';
import { resolveSiblingCalleeBroker } from '../../resolve-sibling/callee/resolve-sibling-callee-broker';
import { writeFile } from '#gateway/node/fs__promises';

export const runCrossFileProbesBroker = async ({
  walked,
  root,
  relPath,
  probeDir,
}: {
  walked: WalkFileResult;
  root: string;
  relPath: string;
  probeDir: string;
}): Promise<string[]> => {
  if (!walked.success) {
    return [];
  }

  const reaches = crossFileMapReachesTransformer({ walked });

  if (reaches.length === 0) {
    return [];
  }

  const { options } = tsconfigReadBroker({ searchPath: root });
  const containingFile = `${root}/${relPath}`;

  // One plan per DISTINCT specifier — two maps of the same sibling share a plan (same bytes, same hash).
  const uniqueSpecifiers = [...new Set(reaches.map((reach) => String(reach.specifier)))];
  const plans = uniqueSpecifiers.flatMap((specifier) => {
    const sibling = resolveSiblingCalleeBroker({ specifier, containingFile, root, options });

    if (!sibling?.walked.success) {
      return [];
    }

    const contentHash = contentHashTransformer({ content: sibling.source });

    return [
      {
        relPath: sibling.relPath,
        path: `${probeDir}/${String(contentHash)}.json`,
        content: JSON.stringify(
          probePlanProjectionTransformer({ walked: sibling.walked, relPath: sibling.relPath, contentHash: String(contentHash) }),
        ),
      },
    ];
  });

  await Promise.all(plans.map(async (plan) => writeFile(plan.path, plan.content)));

  return plans.map((plan) => plan.relPath);
};

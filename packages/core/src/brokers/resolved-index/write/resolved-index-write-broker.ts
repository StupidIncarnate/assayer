/**
 * PURPOSE: Writes the derived resolved index for one namespace to
 *   `.assayer/cache/resolved/<namespace>.json` atomically (tmp write + rename), canonicalizing edge
 *   order first so the same resolution always produces byte-identical JSON — the determinism the
 *   content-hash cache and ref-to-ref diffs depend on. Atomic rename means a crash mid-write never
 *   leaves a half-written index at its final path. It is the resolved-graph twin of manifestWriteBroker.
 *
 * USAGE:
 * await resolvedIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index });
 * // Writes '/repo/.assayer/cache/resolved/feature-x.json' and returns { success: true }
 */
import type { ResolvedIndex } from '@assayer/shared/contracts';

import { ensureDir, rename, writeFile } from '#gateway/node/fs__promises';

import { dirname } from '#gateway/node/path';

export const resolvedIndexWriteBroker = async ({
  configDir,
  namespace,
  index,
}: {
  configDir: string;
  namespace: string;
  index: ResolvedIndex;
}): Promise<void> => {
  const dir = `${configDir}/.assayer/cache/resolved`;
  const canonical = {
    layoutHash: index.layoutHash,
    tsconfigHash: index.tsconfigHash,
    edges: [...index.edges].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)),
  };

  const content = JSON.stringify(canonical);
  const tmpPath = `${dir}/${namespace}.json.tmp`;
  await ensureDir(dirname(tmpPath));

  await writeFile(tmpPath, content);
  await rename(tmpPath, `${dir}/${namespace}.json`);

};

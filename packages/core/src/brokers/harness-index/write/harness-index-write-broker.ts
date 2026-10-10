/**
 * PURPOSE: Writes the derived harness index for one namespace to `.assayer/cache/harness/<namespace>.json`
 *   atomically (tmp write + rename), canonicalizing first — harness files sorted by their own path, each
 *   file's keys sorted by (entry, parameter) — so the same declarations always produce byte-identical
 *   JSON, the determinism the content-hash cache and ref-to-ref diffs depend on. Atomic rename means a
 *   crash mid-write never leaves a half-written index at its final path. It is the harness-stitch twin of
 *   stubIndexWriteBroker.
 *
 * USAGE:
 * await harnessIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index });
 * // Writes '/repo/.assayer/cache/harness/feature-x.json' and returns { success: true }
 */
import type { HarnessIndex } from '@assayer/shared/contracts';
import { ensureDir, rename, writeFile } from '#gateway/node/fs__promises';
import { dirname } from '#gateway/node/path';

export const harnessIndexWriteBroker = async ({
  configDir,
  namespace,
  index,
}: {
  configDir: string;
  namespace: string;
  index: HarnessIndex;
}): Promise<void> => {
  const dir = `${configDir}/.assayer/cache/harness`;
  const tmpPath = `${dir}/${namespace}.json.tmp`;
  await ensureDir(dirname(tmpPath));

  const canonical = {
    layoutHash: index.layoutHash,
    tsconfigHash: index.tsconfigHash,
    harnessHash: index.harnessHash,
    harnesses: [...index.harnesses]
      .sort((a, b) => (String(a.relPath) < String(b.relPath) ? -1 : 1))
      .map((harness) => ({
        relPath: harness.relPath,
        targetRelPath: harness.targetRelPath,
        keys: [...harness.keys].sort((a, b) =>
          String(a.entry) === String(b.entry)
            ? (String(a.param) < String(b.param) ? -1 : 1)
            : (String(a.entry) < String(b.entry) ? -1 : 1),
        ),
      })),
  };

  const content = JSON.stringify(canonical);

  await writeFile(tmpPath, content);
  await rename(tmpPath, `${dir}/${namespace}.json`);

};

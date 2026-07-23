/**
 * PURPOSE: Writes the derived stub index for one namespace to `.assayer/cache/stubs/<namespace>.json`
 *   atomically (tmp write + rename), canonicalizing stub order first — object and env stubs each
 *   sorted by their stable key — so the same demands always produce byte-identical JSON, the
 *   determinism the content-hash cache and ref-to-ref diffs depend on. Atomic rename means a crash
 *   mid-write never leaves a half-written index at its final path. It is the stub-graph twin of
 *   resolvedIndexWriteBroker.
 *
 * USAGE:
 * await stubIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index });
 * // Writes '/repo/.assayer/cache/stubs/feature-x.json' and returns { success: true }
 */
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import type { StubIndex } from '@assayer/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const stubIndexWriteBroker = async ({
  configDir,
  namespace,
  index,
}: {
  configDir: string;
  namespace: string;
  index: StubIndex;
}): Promise<AdapterResult> => {
  const dir = `${configDir}/.assayer/cache/stubs`;
  await fsMkdirAdapter({ path: dir });

  const canonical = {
    layoutHash: index.layoutHash,
    tsconfigHash: index.tsconfigHash,
    objectStubs: [...index.objectStubs].sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1)),
    envStubs: [...index.envStubs].sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1)),
  };

  const content = JSON.stringify(canonical);
  const tmpPath = `${dir}/${namespace}.json.tmp`;

  await fsWriteFileAdapter({ path: tmpPath, content });
  await fsRenameAdapter({ from: tmpPath, to: `${dir}/${namespace}.json` });

  return { success: true as const };
};

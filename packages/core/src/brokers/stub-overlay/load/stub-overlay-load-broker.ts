/**
 * PURPOSE: Loads the COMMITTED stub overlay under a repo root — the human corrections that live at
 *   `assayer/stubs/objects/**` and `assayer/stubs/env/**`, OUTSIDE the cache. Each file's PATH carries
 *   the stable stub identity: an object overlay at `assayer/stubs/objects/<definitionRelPath>/<Type>.json`
 *   keys `<definitionRelPath>#<Type>`, an env overlay at `assayer/stubs/env/<PROPERTY>.json` keys
 *   `process.env#<PROPERTY>`. Each file's content supplies the corrected values, validated against its
 *   on-disk contract. A missing `objects` or `env` directory is an EMPTY overlay, never an error. The
 *   overlay is in no hash — this read never feeds any content/layout hash and never invalidates the
 *   derived stub index; it combines with the derived stubs only at display/consume time.
 *
 * USAGE:
 * await stubOverlayLoadBroker({ repoRoot: '/repo/smoke-repo' });
 * // Returns a readonly StubOverlay[] sorted by key — the committed corrections found under the root
 */
import { stubOverlayContract } from '@assayer/shared/contracts';
import type { StubOverlay } from '@assayer/shared/contracts';

import { stubOverlayObjectFileContract } from '../../../contracts/stub-overlay-object-file/stub-overlay-object-file-contract';
import { stubOverlayEnvFileContract } from '../../../contracts/stub-overlay-env-file/stub-overlay-env-file-contract';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathBasenameAdapter } from '../../../adapters/path/basename/path-basename-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathRelativeAdapter } from '../../../adapters/path/relative/path-relative-adapter';
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';

const JSON_EXT = '.json';

export const stubOverlayLoadBroker = async ({ repoRoot }: { repoRoot: string }): Promise<readonly StubOverlay[]> => {
  const objectsRoot = `${repoRoot}/assayer/stubs/objects`;
  const envRoot = `${repoRoot}/assayer/stubs/env`;

  const objectAbs = (await fsExistsAdapter({ path: objectsRoot }))
    ? await compileWalkWorkingTreeBroker({ root: objectsRoot })
    : [];
  const envAbs = (await fsExistsAdapter({ path: envRoot }))
    ? await compileWalkWorkingTreeBroker({ root: envRoot })
    : [];

  const objectEntries = await Promise.all(
    objectAbs
      .filter((abs) => String(abs).endsWith(JSON_EXT))
      .map(async (abs) => {
        const relFromObjects = pathRelativeAdapter({ from: objectsRoot, to: String(abs) });
        const definitionRelPath = pathDirnameAdapter({ path: String(relFromObjects) });
        const typeName = String(pathBasenameAdapter({ path: String(relFromObjects) })).slice(0, -JSON_EXT.length);
        const raw = await fsReadFileAdapter({ path: String(abs) });
        const file = stubOverlayObjectFileContract.parse(JSON.parse(String(raw)));
        const properties = Object.entries(file.properties)
          .map(([name, spec]) => ({ name, values: spec === undefined ? [] : spec.values }))
          .sort((a, b) => (a.name < b.name ? -1 : 1));

        return stubOverlayContract.parse({
          kind: 'object',
          key: `${String(definitionRelPath)}#${typeName}`,
          overlayPath: `assayer/stubs/objects/${String(relFromObjects)}`,
          properties,
        });
      }),
  );

  const envEntries = await Promise.all(
    envAbs
      .filter((abs) => String(abs).endsWith(JSON_EXT))
      .map(async (abs) => {
        const relFromEnv = pathRelativeAdapter({ from: envRoot, to: String(abs) });
        const property = String(pathBasenameAdapter({ path: String(relFromEnv) })).slice(0, -JSON_EXT.length);
        const raw = await fsReadFileAdapter({ path: String(abs) });
        const file = stubOverlayEnvFileContract.parse(JSON.parse(String(raw)));

        return stubOverlayContract.parse({
          kind: 'env',
          key: `process.env#${property}`,
          overlayPath: `assayer/stubs/env/${String(relFromEnv)}`,
          property,
          values: file.values,
        });
      }),
  );

  return [...objectEntries, ...envEntries].sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1));
};

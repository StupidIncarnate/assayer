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

import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { pathExists, readFile } from '#gateway/node/fs__promises';
import { basename, dirname, relative } from '#gateway/node/path';

const JSON_EXT = '.json';

export const stubOverlayLoadBroker = async ({ repoRoot }: { repoRoot: string }): Promise<readonly StubOverlay[]> => {
  const objectsRoot = `${repoRoot}/assayer/stubs/objects`;
  const envRoot = `${repoRoot}/assayer/stubs/env`;

  const objectAbs = (await pathExists(objectsRoot))
    ? await compileWalkWorkingTreeBroker({ root: objectsRoot })
    : [];
  const envAbs = (await pathExists(envRoot))
    ? await compileWalkWorkingTreeBroker({ root: envRoot })
    : [];

  const objectEntries = await Promise.all(
    objectAbs
      .filter((abs) => String(abs).endsWith(JSON_EXT))
      .map(async (abs) => {
        const relFromObjects = relative(objectsRoot, String(abs));
        const definitionRelPath = dirname(String(relFromObjects));
        const typeName = String(basename(String(relFromObjects))).slice(0, -JSON_EXT.length);
        const raw = (await readFile(String(abs)));
        const file = stubOverlayObjectFileContract.parse(JSON.parse(String(raw)));
        const properties = Object.entries(file.properties)
          .map(([name, spec]) => ({ name, values: spec.values }))
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
        const relFromEnv = relative(envRoot, String(abs));
        const property = String(basename(String(relFromEnv))).slice(0, -JSON_EXT.length);
        const raw = (await readFile(String(abs)));
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

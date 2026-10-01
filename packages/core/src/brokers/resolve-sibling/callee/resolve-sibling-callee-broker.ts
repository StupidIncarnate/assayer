/**
 * PURPOSE: Resolves an imported specifier to the SIBLING file on disk and walks it — the one
 *   sibling-read sequence every consume-time cross-file overlay runs. A per-file blob never reads
 *   another file, so resolving `./band-reading` to its definition and parsing it is done here, per run,
 *   against the repo on disk: TypeScript's own resolver (the same `tsc` runs, so relative spellings and
 *   path aliases collapse to one canonical file, under the compiler options of the tsconfig that owns
 *   the importing file), then the in-repo guard (a specifier that lands under
 *   `node_modules` or outside the root is not a walkable sibling), then a single walk of the resolved
 *   file, under the tsconfig that owns the sibling.
 *
 *   It returns the sibling's walk, its repo-relative path, and its raw source — the last so a caller
 *   that must instrument the sibling can key a probe plan on the SAME bytes ts-jest hashes. A specifier
 *   that does not resolve, or resolves outside the repo, is `undefined`: the caller leaves whatever it
 *   was composing untouched. It never re-parses the CALLER — the caller already holds that walk.
 *
 * USAGE:
 * resolveSiblingCalleeBroker({ specifier: './band-reading', containingFile: '/repo/src/a.ts', root: '/repo' });
 * // Returns { walked, relPath: 'src/band-reading.ts', source } or undefined
 */

import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { fileWalkBroker } from '../../file/walk/file-walk-broker';
import { tsconfigOwnerBroker } from '../../tsconfig/owner/tsconfig-owner-broker';
import { importSpecifierResolveBroker } from '../../import-specifier/resolve/import-specifier-resolve-broker';
import { readFileSync } from '#gateway/node/fs';
import { relative } from '#gateway/node/path';

export const resolveSiblingCalleeBroker = ({
  specifier,
  containingFile,
  root,
}: {
  specifier: string;
  containingFile: string;
  root: string;
}): { walked: WalkFileResult; relPath: string; source: string } | undefined => {
  const { options } = tsconfigOwnerBroker({ absPath: containingFile });
  const resolved = importSpecifierResolveBroker({ specifier, containingFile, options });

  if (!resolved.resolved) {
    return undefined;
  }

  const fileName = String(resolved.fileName);
  const relPath = relative(root, fileName);

  if (relPath.startsWith('..') || fileName.includes('/node_modules/')) {
    return undefined;
  }

  const source = readFileSync(fileName);

  return { walked: fileWalkBroker({ source, relPath, absPath: fileName }), relPath, source };
};

/**
 * PURPOSE: Resolves an imported specifier to the SIBLING file on disk and walks it — the one
 *   sibling-read sequence every consume-time cross-file overlay runs. A per-file blob never reads
 *   another file, so resolving `./band-reading` to its definition and parsing it is done here, per run,
 *   against the repo on disk: TypeScript's own resolver (the same `tsc` runs, so relative spellings and
 *   path aliases collapse to one canonical file), then the in-repo guard (a specifier that lands under
 *   `node_modules` or outside the root is not a walkable sibling), then a single walk of the resolved
 *   file.
 *
 *   It returns the sibling's walk, its repo-relative path, and its raw source — the last so a caller
 *   that must instrument the sibling can key a probe plan on the SAME bytes ts-jest hashes. A specifier
 *   that does not resolve, or resolves outside the repo, is `undefined`: the caller leaves whatever it
 *   was composing untouched. It never re-parses the CALLER — the caller already holds that walk.
 *
 * USAGE:
 * resolveSiblingCalleeBroker({ specifier: './band-reading', containingFile: '/repo/src/a.ts', root: '/repo', options });
 * // Returns { walked, relPath: 'src/band-reading.ts', source } or undefined
 */
import type { RelPath } from '@assayer/shared/contracts';

import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { importSpecifierResolveBroker } from '../../import-specifier/resolve/import-specifier-resolve-broker';
import { readFileSync } from '#gateway/node/fs';
import { relative } from '#gateway/node/path';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import { relPathContract } from '@assayer/shared/contracts';

export const resolveSiblingCalleeBroker = ({
  specifier,
  containingFile,
  root,
  options,
}: {
  specifier: string;
  containingFile: string;
  root: string;
  options: Parameters<typeof importSpecifierResolveBroker>[0]['options'];
}): { walked: ReturnType<typeof walkFileTransformer>; relPath: RelPath; source: FileContents } | undefined => {
  const resolved = importSpecifierResolveBroker({ specifier, containingFile, options });

  if (!resolved.resolved) {
    return undefined;
  }

  const fileName = String(resolved.fileName);
  const relPath = relPathContract.parse(relative(root, fileName));

  if (String(relPath).startsWith('..') || fileName.includes('/node_modules/')) {
    return undefined;
  }

  const source = fileContentsContract.parse(readFileSync(fileName));

  return { walked: walkFileTransformer({ source: String(source), relPath: String(relPath) }), relPath, source };
};

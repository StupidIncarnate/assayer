/**
 * PURPOSE: Assembles the current compile-plan targets for a repo root — walking the working
 *   tree, resolving each file to its repo-relative path, filtering to included TypeScript
 *   source files, and reading each one's current on-disk content (including uncommitted edits).
 *
 * USAGE:
 * await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });
 * // Returns { targets: [{ relPath: 'src/foo.ts', content: 'export const x = 1;\n' }, ...] } —
 * // every included source file's current on-disk bytes, path relative to root
 */
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathRelativeAdapter } from '../../../adapters/path/relative/path-relative-adapter';
import { isSourceFileIncludedGuard } from '../../../guards/is-source-file-included/is-source-file-included-guard';
import type { RelPath } from '@assayer/shared/contracts';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const compilePlanCurrentBroker = async ({
  root,
  exclude,
}: {
  root: string;
  exclude?: readonly string[];
}): Promise<{ targets: { relPath: RelPath; content: FileContents }[] }> => {
  const absPaths = await compileWalkWorkingTreeBroker({ root });

  const relPathed = absPaths.map((abs) => ({
    abs,
    relPath: pathRelativeAdapter({ from: root, to: String(abs) }),
  }));

  const included = relPathed.filter((r) =>
    isSourceFileIncludedGuard({
      relPath: String(r.relPath),
      ...(exclude ? { exclude } : {}),
    })
  );

  const targets = await Promise.all(
    included.map(async (r) => ({
      relPath: r.relPath,
      content: await fsReadFileAdapter({ path: String(r.abs) }),
    }))
  );

  return { targets };
};

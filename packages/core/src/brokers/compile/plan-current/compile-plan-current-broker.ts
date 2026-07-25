/**
 * PURPOSE: Assembles the current compile-plan for a repo root — walking the working tree, resolving
 *   each file to its repo-relative path, filtering to included TypeScript source files, reading each
 *   one's current on-disk content (including uncommitted edits), and classifying the Assayer HARNESSES
 *   out of the analysed targets.
 *
 *   The split is `harnessClassifyBroker`'s, not this broker's, so the compiler, the catalogue walk and
 *   the surface e2e all answer "what is analysed?" from one rule. A `*.harness.ts` that never imports
 *   and calls `assayerHarness` stays an ordinary target, which is why the inclusion guard carries no
 *   `.harness.` rule of its own: it would silently drop a consumer's real source.
 *
 * USAGE:
 * await compilePlanCurrentBroker({ root: '/repo/smoke-repo' });
 * // Returns { targets: [{ relPath: 'src/foo.ts', content: 'export const x = 1;\n' }, ...],
 * //           harnesses: [{ relPath: 'src/foo.harness.ts', content: '…' }] }
 */
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { harnessClassifyBroker } from '../../harness/classify/harness-classify-broker';
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
}): Promise<{
  targets: { relPath: RelPath; content: FileContents }[];
  harnesses: { relPath: RelPath; content: FileContents }[];
}> => {
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

  const planned = await Promise.all(
    included.map(async (r) => ({
      relPath: r.relPath,
      content: await fsReadFileAdapter({ path: String(r.abs) }),
    }))
  );

  return harnessClassifyBroker({ files: planned });
};

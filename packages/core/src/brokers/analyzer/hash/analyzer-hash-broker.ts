/**
 * PURPOSE: Computes a deterministic content hash of the code Assayer itself runs, the code a cached
 *   blob depends on, so the cache invalidates whenever Assayer's analysis logic changes, with no
 *   hand-maintained version to bump. Each root is one tree: a root whose last folder is `dist` is a
 *   compiled tree and hashes its emitted `.js`; any other root is a source tree and hashes only its
 *   implementation files, never a proxy, stub, test or harness (see isAnalyzerCodeFileGuard). So an
 *   edit to code that does not run never moves the hash.
 *
 *   The hash also covers the installed ts-morph version. ts-morph bundles the TypeScript compiler
 *   that parses every file, so a ts-morph upgrade can change the analysis without changing a byte
 *   of Assayer's own code. ts-morph is found the way Node finds it for the code that loads it: from
 *   @assayer/npm (the package `#gateway/npm/ts-morph` maps to), which is itself found from this
 *   module's directory, each through the nearest `node_modules/<name>/package.json` above.
 *
 *   The hash also covers every file the wrapped runner (the nested Jest a run starts) loads by path:
 *   the plain-JS files at core's package root, and the typed run-time modules, core's root `index`
 *   among them. The root files sit under no root, and neither does a source run's `index.ts`. The
 *   list comes from `coreRuntimeTransformer`, the same transformer the run reads its paths from, so a
 *   new run-time file joins the hash with no edit here. Core's package root is found the way
 *   `runPathsBroker` finds it: the nearest directory at or above the start holding the runner's setup
 *   file. A module path names no extension, so it takes `.js` in a `dist` run and `.ts` in a source
 *   run.
 *
 *   Each file contributes its path relative to its root (or to core's package root, for a run-time
 *   file) plus its content hash, sorted. The digests fold into one hash after the ts-morph version
 *   line: the run-time files' digest first, then each root's. Relative paths keep the result identical
 *   across machines and checkout locations. Sorting keeps it independent of walk order.
 *
 * USAGE:
 * await analyzerHashBroker({ roots: ['/repo/packages/core/dist', '/repo/packages/shared/dist'] });
 * // Returns a ContentHash that changes when a hashed file's path or content, a run-time file's
 * // content, or ts-morph's version changes
 */
import { compileWalkWorkingTreeBroker } from '../../compile/walk-working-tree/compile-walk-working-tree-broker';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { coreRuntimeTransformer } from '../../../transformers/core-runtime/core-runtime-transformer';
import { isAnalyzerCodeFileGuard } from '../../../guards/is-analyzer-code-file/is-analyzer-code-file-guard';
import { analyzerHashStatics } from '../../../statics/analyzer-hash/analyzer-hash-statics';
import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import type { ContentHash } from '@assayer/shared/contracts';
import { findUpSync, readJsonFileSync, realpathSync } from '#gateway/node/fs';
import { readFile } from '#gateway/node/fs__promises';
import { basename, dirname, extname, join, relative } from '#gateway/node/path';
import { z } from '#gateway/npm/zod';

const tsMorphManifestContract = z.object({ version: z.string().min(1).brand<'TsMorphManifestVersion'>() });

export const analyzerHashBroker = async ({
  roots,
  from,
}: {
  roots: string[];
  from?: string;
}): Promise<ContentHash> => {
  const startDir = from === undefined ? __dirname : from;
  const gatewayManifest = findUpSync({ startDir, fileName: join('node_modules', '@assayer', 'npm', 'package.json') });
  if (gatewayManifest === null) {
    throw new Error(
      `assayer: cannot locate the installed package @assayer/npm: no node_modules/@assayer/npm/package.json in ${startDir} ` +
        'or any directory above it. The install is incomplete; reinstall assayer.',
    );
  }

  const gatewayDir = realpathSync(dirname(gatewayManifest));
  const tsMorphManifest = findUpSync({ startDir: gatewayDir, fileName: join('node_modules', 'ts-morph', 'package.json') });
  if (tsMorphManifest === null) {
    throw new Error(
      `assayer: cannot locate the installed package ts-morph: no node_modules/ts-morph/package.json in ${gatewayDir} ` +
        'or any directory above it. The install is incomplete; reinstall assayer.',
    );
  }

  const { version } = tsMorphManifestContract.parse(readJsonFileSync(tsMorphManifest));

  const { setupFile } = coreRuntimeStatics.ceremony;
  const runtimeMarker = findUpSync({ startDir, fileName: setupFile });
  if (runtimeMarker === null) {
    throw new Error(
      `assayer: cannot locate the @assayer/core package root: no ${setupFile} in ${startDir} or any directory above ` +
        'it. The install is incomplete; reinstall assayer.',
    );
  }

  const coreRoot = dirname(runtimeMarker);
  const { tree, ...runtimePaths } = coreRuntimeTransformer({ coreRoot, loadedFrom: startDir });
  const moduleExtension = tree === 'dist' ? analyzerHashStatics.dist.codeExtension : '.ts';
  const runtimeFiles = Object.values(runtimePaths).map((path) => ({
    path: extname(path) === '' ? `${path}${moduleExtension}` : path,
    base: coreRoot,
  }));

  const fileSets = [
    runtimeFiles,
    ...(await Promise.all(
      roots.map(async (root) => {
        const rootTree = basename(root) === coreRuntimeStatics.layout.distFolder ? 'dist' : 'source';
        const files = await compileWalkWorkingTreeBroker({ root });
        return files
          .map((path) => ({ path, base: root }))
          .filter(({ path }) => isAnalyzerCodeFileGuard({ relPath: relative(root, path), tree: rootTree }));
      }),
    )),
  ];

  const digests = await Promise.all(
    fileSets.map(async (fileSet) => {
      const entries = await Promise.all(
        fileSet.map(async ({ path, base }) => {
          const content = await readFile(path);
          return `${relative(base, path)}:${contentHashTransformer({ content })}`;
        }),
      );
      return contentHashTransformer({ content: [...entries].sort().join('\n') });
    }),
  );

  return contentHashTransformer({ content: [`ts-morph@${version}`, ...digests].join('\n') });
};

/**
 * PURPOSE: Derives the compiled-surface expectations for the syntax-repository catalogue by WALKING it
 *   off disk, the SAME way the analyzer's specimen-catalogue and the compiler's inclusion rule do —
 *   every `.ts` under smoke-repo/packages/syntax-repository/src that is not a `.test.ts`. The surface
 *   e2e asserts UI faithfulness (the header's file counts, the FILE_TREE_FILE leaves, the FILE_TREE_DIR
 *   nodes) against these derived values instead of a hand-listed snapshot, so a new specimen never
 *   forces an edit here: the walk answers "every specimen" the moment the file lands on disk.
 *
 *   Not wired for lifecycle — it owns no temp state, so it is a plain disk lookup the describe scope
 *   calls while building expectations, exactly like the analyzer's specimen-catalogue.
 *
 * USAGE:
 * const surface = syntaxSurfaceHarness();
 * await expect(header).toHaveText(surface.surfaceHeaderPattern());
 * expect([...fileNames].sort()).toStrictEqual(surface.fileLeaves());
 * expect([...dirNames].sort()).toStrictEqual(surface.dirNames());
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from '#gateway/node/path';
import { RelPathStub, FolderNameStub } from '@assayer/shared/contracts';

import { typescriptHarnessGateAdapter } from '../../../core/src/adapters/typescript/harness-gate/typescript-harness-gate-adapter';
import { harnessModuleStatics } from '../../../core/src/statics/harness-module/harness-module-statics';

const SMOKE_REPO = join(__dirname, '..', '..', '..', '..', 'smoke-repo');
const CATALOGUE_DIR = join(SMOKE_REPO, 'packages', 'syntax-repository', 'src');

// The compiled surface is what a compile ANALYSED, and a colocated Assayer harness is classified out of
// it — so the same suffix-plus-symbol-gate rule the compiler applies is applied here, off the same
// bytes. A `*.harness.ts` that never registers stays a specimen, exactly as it stays an analysed target.
const isAnalysed = (entry: { name: string; parentPath: string }): boolean =>
  !entry.name.endsWith(harnessModuleStatics.fileSuffix) ||
  !typescriptHarnessGateAdapter({ source: readFileSync(join(entry.parentPath, entry.name), 'utf8') });

// The combined `.ts`/`.tsx` inclusion rule the header's own `ts N tsx M` counts apply separately — a
// harness is never `.tsx` (CLAUDE.md: colocated harnesses are always `.ts`, even beside a `.tsx`
// source), so the symbol gate only ever applies to the `.ts` half.
const isAnalysedSourceFile = (entry: { name: string; parentPath: string }): boolean =>
  (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && isAnalysed(entry)) ||
  (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx'));

export const syntaxSurfaceHarness = (): {
  surfaceHeaderPattern: () => RegExp;
  fileLeaves: () => ReturnType<typeof RelPathStub>[];
  dirNames: () => ReturnType<typeof FolderNameStub>[];
} => ({
  // The header pins the compiled surface's file counts: `ts N tsx M`, where N/M come from the same
  // inclusion rule the compiler uses (a `.ts`/`.tsx` that is not a colocated `.test.ts`/`.test.tsx`).
  // Brand/root/repo prefix is stable; the branch token is the working-tree namespace, so it stays a
  // non-space wildcard.
  surfaceHeaderPattern: (): RegExp => {
    const entries = readdirSync(CATALOGUE_DIR, { recursive: true, withFileTypes: true });
    const tsCount = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && isAnalysed(entry),
    ).length;
    const tsxCount = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx'),
    ).length;
    return new RegExp(`^Assayer \\| smoke-repo assayer/\\S+ \\| ts ${tsCount} tsx ${tsxCount}$`, 'u');
  },

  // The FILE_TREE_FILE leaves are the specimen basenames — duplicates included (in-function.ts ×3,
  // in-class.ts ×2, pure-statement.ts ×2), sorted, matching the tree the manifest relPaths build. Both
  // `.ts` and `.tsx` specimens are leaves, exactly as both feed the header's `ts N tsx M` counts.
  fileLeaves: (): ReturnType<typeof RelPathStub>[] =>
    readdirSync(CATALOGUE_DIR, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && isAnalysedSourceFile(entry))
      .map((entry) => entry.name)
      .sort()
      .map((value) => RelPathStub({ value })),

  // The FILE_TREE_DIR nodes are the directory nodes the tree renders — one per DISTINCT directory PATH on
  // the way to a specimen. Deduping the full smoke-repo-relative paths collapses a shared prefix
  // (`packages`, `syntax-repository`, `src`, the happy-path/sad-path buckets) to one node, while sibling
  // paths that share a basename stay distinct — in-function ×3, in-class/length/pure-statement/unreachable
  // ×2 — each rendered showing that basename, exactly as the tree does. Projected to the basename and
  // sorted to match the asserted [...dirNames].sort().
  dirNames: (): ReturnType<typeof FolderNameStub>[] => {
    const dirPaths = new Set(
      readdirSync(CATALOGUE_DIR, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && isAnalysedSourceFile(entry))
        .flatMap((entry) => {
          const segments = relative(SMOKE_REPO, entry.parentPath).split(sep);
          return [...segments.keys()].map((index) => segments.slice(0, index + 1).join(sep));
        }),
    );
    return [...dirPaths]
      .map((dirPath) => dirPath.slice(dirPath.lastIndexOf(sep) + 1))
      .sort()
      .map((value) => FolderNameStub({ value }));
  },
});

/**
 * PURPOSE: Lists the syntax-repository catalogue by WALKING it — every specimen source file on disk,
 *   as a repo-relative path the analyzer and the run engine both accept.
 *
 *   Discovery, never a list. A hand-maintained array of specimens goes stale the moment someone adds
 *   syntax, and goes stale SILENTLY: the new file is simply never tested, and a suite that skipped it
 *   looks exactly like a suite that passed it. Walking the directory is what makes "every specimen"
 *   mean every specimen.
 *
 *   `*.test.ts` is excluded for the same reason the analyzer excludes it: a specimen's colocated test
 *   is not part of the analyzed surface. So is a colocated Assayer HARNESS, and by the same rule the
 *   compiler applies — the `.harness.ts` suffix plus the symbol gate, never the filename alone — so the
 *   catalogue and the compiled surface can never disagree about which files are specimens.
 *
 *   Not a `.harness.ts`: it owns no beforeEach/afterEach and no temp state, so it is a plain lookup
 *   the module scope can call while Jest is still collecting `it.each` cases.
 *
 *   `syntacticErrors` answers the one question every specimen owes regardless of what it contains:
 *   is it valid TypeScript at all? Asked here, once, rather than re-authored per specimen — a check
 *   copied into every file is a check nobody adds to the sixteenth.
 *
 * USAGE:
 * specimenCatalogue().relPaths();
 * // ['packages/syntax-repository/src/happy-path/boolean/and/and.ts', ...] — sorted, smoke-repo-relative
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join, relative, sep, basename, dirname, extname } from 'node:path';

import { Project, ts } from 'ts-morph';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

import { typescriptHarnessGateAdapter } from '../../src/adapters/typescript/harness-gate/typescript-harness-gate-adapter';
import { harnessModuleStatics } from '../../src/statics/harness-module/harness-module-statics';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'smoke-repo');
const CATALOGUE_DIR = join(SMOKE_REPO, 'packages', 'syntax-repository', 'src');

// A `.harness.ts` that never registers is ordinary source, not a harness — the same gate the compiler
// applies, off the same bytes, so the catalogue and the compiled surface can never disagree.
const isAnalysed = (entry: { name: string; parentPath: string }): boolean =>
  !entry.name.endsWith(harnessModuleStatics.fileSuffix) ||
  !typescriptHarnessGateAdapter({ source: readFileSync(join(entry.parentPath, entry.name), 'utf8') });

// The combined `.ts`/`.tsx` inclusion rule the compiled surface applies — a harness is never `.tsx`
// (CLAUDE.md: a colocated harness is always `.ts`, even beside a `.tsx` source), so the symbol gate
// only ever applies to the `.ts` half. Mirrors `syntax-surface.harness.ts`'s `isAnalysedSourceFile`
// exactly, so the two walkers can never enumerate different file sets.
const isAnalysedSourceFile = (entry: { name: string; parentPath: string }): boolean =>
  (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && isAnalysed(entry)) ||
  (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx'));

export const specimenCatalogue = (): {
  relPaths: () => RelPath[];
  roots: () => { relPath: RelPath; bucket: 'happy-path' | 'sad-path' }[];
  children: () => RelPath[];
  structuralErrors: () => ErrorMessage[];
  syntacticErrors: (params: { relPath: string }) => ErrorMessage[];
} => ({
  relPaths: (): RelPath[] =>
    readdirSync(CATALOGUE_DIR, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && isAnalysedSourceFile(entry))
      // Posix-joined rather than platform-joined: the relPath is a cache and manifest key, so it must
      // not change shape with the OS that produced it.
      .map((entry) => relative(SMOKE_REPO, join(entry.parentPath, entry.name)).split(sep).join('/'))
      .sort()
      .map((relPath) => relPathContract.parse(relPath)),

  // The EPONYMOUS specimens — a file that names its own folder (`boolean/and/and.ts`) — paired with
  // the bucket their path declares. These are the roots whose run verdict the bucket claims; the
  // driver checks each against it. Compared by BASENAME MINUS ITS OWN EXTENSION, so a `.tsx` root
  // (`component/component.tsx`) is recognized exactly as a `.ts` one is.
  roots: (): { relPath: RelPath; bucket: 'happy-path' | 'sad-path' }[] =>
    specimenCatalogue()
      .relPaths()
      .filter((relPath) => basename(String(relPath), extname(String(relPath))) === basename(dirname(String(relPath))))
      .map((relPath) => ({
        relPath,
        bucket: relative(CATALOGUE_DIR, join(SMOKE_REPO, String(relPath))).split(sep)[0] as 'happy-path' | 'sad-path',
      })),

  // The helper CHILDREN — every other file in an example folder (`uses-greeting/greeting.ts`). They
  // ride their root and are never checked against a bucket on their own.
  children: (): RelPath[] =>
    specimenCatalogue()
      .relPaths()
      .filter((relPath) => basename(String(relPath), extname(String(relPath))) !== basename(dirname(String(relPath)))),

  // The `<bucket>/…/<name>/<name>.{ts,tsx}` invariant, checked off disk and returned as named
  // violations so the test asserts an empty list. Every specimen sits under a known bucket and owes
  // its colocated test (same extension as the root — a `.tsx` root's is `.test.tsx`); every child must
  // share its folder with the eponymous root it rides, so a folder cannot hold orphan helpers with no
  // root to belong to. The colocated-test and orphan-root lookups are keyed on the file's OWN
  // extension: `.replace(/\.ts$/u, …)` never matches a `.tsx` path (it ends in `x`, not `s`), so an
  // extension-blind version would silently pass a `.tsx` root with no colocated test at all.
  structuralErrors: (): ErrorMessage[] =>
    specimenCatalogue()
      .relPaths()
      .flatMap((relPath): ErrorMessage[] => {
        const rel = String(relPath);
        const abs = join(SMOKE_REPO, rel);
        const [bucket] = relative(CATALOGUE_DIR, abs).split(sep);
        const ext = extname(rel);
        const base = basename(rel, ext);
        const eponymous = base === basename(dirname(rel));
        const rootName = basename(dirname(rel));

        return [
          bucket !== 'happy-path' && bucket !== 'sad-path' ? `${rel}: not under happy-path/ or sad-path/` : null,
          existsSync(`${abs.slice(0, -ext.length)}.test${ext}`)
            ? null
            : `${rel}: missing its colocated ${base}.test${ext}`,
          eponymous ||
          existsSync(join(dirname(abs), `${rootName}.ts`)) ||
          existsSync(join(dirname(abs), `${rootName}.tsx`))
            ? null
            : `${rel}: orphan child — its folder has no eponymous ${rootName}.ts or ${rootName}.tsx`,
        ].flatMap((message) => (message === null ? [] : [errorMessageContract.parse(message)]));
      }),

  syntacticErrors: ({ relPath }: { relPath: string }): ErrorMessage[] => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(basename(relPath), readFileSync(join(SMOKE_REPO, relPath), 'utf8'));

    return (
      project
        .getProgram()
        .getSyntacticDiagnostics(sourceFile)
        // Flattened rather than stringified: a diagnostic's message is a string OR a nested chain, and
        // the chain stringifies to '[object Object]' — which would report a real syntax error as noise.
        .map((diagnostic) =>
          errorMessageContract.parse(ts.flattenDiagnosticMessageText(diagnostic.compilerObject.messageText, '\n')),
        )
    );
  },
});

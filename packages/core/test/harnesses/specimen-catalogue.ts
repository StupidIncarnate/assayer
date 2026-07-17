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
 *   is not part of the analyzed surface.
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
 * // ['packages/syntax-repository/src/boolean/and.ts', ...] — sorted, smoke-repo-relative
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join, relative, sep, basename } from 'node:path';

import { Project, ts } from 'ts-morph';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'smoke-repo');
const CATALOGUE_DIR = join(SMOKE_REPO, 'packages', 'syntax-repository', 'src');

export const specimenCatalogue = (): {
  relPaths: () => RelPath[];
  syntacticErrors: (params: { relPath: string }) => ErrorMessage[];
} => ({
  relPaths: (): RelPath[] =>
    readdirSync(CATALOGUE_DIR, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))
      // Posix-joined rather than platform-joined: the relPath is a cache and manifest key, so it must
      // not change shape with the OS that produced it.
      .map((entry) => relative(SMOKE_REPO, join(entry.parentPath, entry.name)).split(sep).join('/'))
      .sort()
      .map((relPath) => relPathContract.parse(relPath)),

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

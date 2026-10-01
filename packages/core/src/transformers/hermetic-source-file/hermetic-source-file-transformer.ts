/**
 * PURPOSE: Parses one source string into a hermetic ts-morph source file, hands it to `read`, and
 *   removes it again before returning. Every hermetic parse in core goes through here, so
 *   TypeScript's lib `.d.ts` files are parsed once per process instead of once per file.
 *
 *   The process keeps one in-memory ts-morph project per compiler-options set. A call adds its file
 *   to that project, and removes it in a `finally` once `read` returns or throws. So a call's
 *   program holds only its own file plus the lib files, and no file from an earlier call stays
 *   visible to a later one. ts-morph builds each new program from the previous one, which keeps
 *   the already-parsed lib files and parses only the new file. The checker is new for each
 *   program, so a call's types never depend on what an earlier call checked.
 *
 *   A call made from inside another call's `read` finds the shared project still holding the
 *   outer file. That inner call parses in a throwaway project instead, so it still sees only its
 *   own file.
 *
 *   `read` must copy out everything it needs as plain data. The source file and every node and
 *   type in it belong to the shared project, and stop being valid once this call returns.
 *
 * USAGE:
 * hermeticSourceFileTransformer({
 *   compilerOptions: { strictNullChecks: true },
 *   relPath: 'src/f.ts',
 *   source: 'export const n = 1;',
 *   read: ({ sourceFile }) => sourceFile.getVariableDeclarations().length,
 * });
 * // Returns 1
 */
import { Project } from '#gateway/npm/ts-morph';
import type { CompilerOptions, SourceFile } from '#gateway/npm/ts-morph';

const projectByOptions = new Map<string, Project>();

export const hermeticSourceFileTransformer = <T>({
  compilerOptions,
  relPath,
  source,
  read,
}: {
  compilerOptions: CompilerOptions;
  relPath: string;
  source: string;
  read: (params: { sourceFile: SourceFile }) => T;
}): T => {
  // Sorted, so two spellings of one option set share one project and two different sets never do.
  const key = JSON.stringify(
    Object.keys(compilerOptions)
      .sort()
      .map((name) => [name, compilerOptions[name]]),
  );
  const cached = projectByOptions.get(key);
  const shared = cached ?? new Project({ useInMemoryFileSystem: true, compilerOptions });

  if (cached === undefined) {
    projectByOptions.set(key, shared);
  }

  const project =
    shared.getSourceFiles().length === 0 ? shared : new Project({ useInMemoryFileSystem: true, compilerOptions });
  const sourceFile = project.createSourceFile(relPath, source);

  try {
    return read({ sourceFile });
  } finally {
    project.removeSourceFile(sourceFile);
  }
};

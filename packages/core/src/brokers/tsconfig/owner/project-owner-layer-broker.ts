/**
 * PURPOSE: Answers whether one tsconfig, or a project it references, owns a file, by looking the file up in
 *   TypeScript's own parsed file list. A config owns the file when its `fileNames` (include, files and exclude
 *   already applied by TypeScript) hold the file's absolute path. When it does not, each project reference is
 *   asked in turn, so a solution config (`files: []` with `references`) owns nothing itself and hands the
 *   question to its projects. `seen` stops a reference cycle.
 *
 * USAGE:
 * projectOwnerLayerBroker({ absPath: '/repo/packages/app/src/main.ts', configFilePath: '/repo/tsconfig.json', seen: [] });
 * // Returns { configFilePath: '/repo/packages/app/tsconfig.json', options: { strict: true } }, or undefined
 */
import { readTsconfig } from '#gateway/npm/typescript';
import type { CompilerOptions } from '#gateway/npm/typescript';

export const projectOwnerLayerBroker = ({
  absPath,
  configFilePath,
  seen,
}: {
  absPath: string;
  configFilePath: string;
  seen: readonly string[];
}): { configFilePath: string; options: CompilerOptions } | undefined => {
  if (seen.includes(configFilePath)) {
    return undefined;
  }

  const parsed = readTsconfig({ configFilePath });

  if (parsed === undefined) {
    return undefined;
  }

  if (parsed.fileNames.includes(absPath)) {
    return { configFilePath, options: parsed.options };
  }

  const nextSeen = [...seen, configFilePath];

  return parsed.references.reduce<{ configFilePath: string; options: CompilerOptions } | undefined>(
    (found, reference: string) =>
      found ?? projectOwnerLayerBroker({ absPath, configFilePath: reference, seen: nextSeen }),
    undefined,
  );
};

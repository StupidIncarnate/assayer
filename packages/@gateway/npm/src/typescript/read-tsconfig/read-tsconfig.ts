/**
 * PURPOSE: Parses one tsconfig file with TypeScript's own parser, `getParsedCommandLineOfConfigFile`, over
 * `ts.sys`. Returns the file list with `include`, `files` and `exclude` already applied, the config path of
 * each project reference, and the compiler options with the whole `extends` chain merged. Reach for this,
 * not `readNearestTsconfig`, when the question is which files a config owns, or when the config is named
 * by path (a project reference such as `tsconfig.scripts.json`) rather than found by searching. Returns
 * undefined when TypeScript cannot read the file. A test stages it through `readTsconfigProxy`, because
 * `ts.sys` reads the real disk.
 *
 * USAGE:
 * readTsconfig({ configFilePath: '/repo/packages/app/tsconfig.json' });
 * // Returns { configFilePath, fileNames: ['/repo/packages/app/src/main.ts'], references: [], options: { strict: true } }
 */
import {
  getParsedCommandLineOfConfigFile,
  resolveProjectReferencePath,
  sys,
} from '../bundled-typescript/bundled-typescript';
import type { CompilerOptions } from '../bundled-typescript/bundled-typescript';

export const readTsconfig = ({
  configFilePath,
}: {
  configFilePath: string;
}): { configFilePath: string; fileNames: string[]; references: string[]; options: CompilerOptions } | undefined => {
  // An unreadable config makes TypeScript call the reporter below and then return undefined, and undefined is
  // this wrapper's answer for it, so the reporter has nothing left to do. A config that parses with errors still
  // returns its file list and options.
  const parsed = getParsedCommandLineOfConfigFile(configFilePath, undefined, {
    useCaseSensitiveFileNames: sys.useCaseSensitiveFileNames,
    readDirectory: (rootDir, extensions, excludes, includes, depth) =>
      sys.readDirectory(rootDir, extensions, excludes, includes, depth),
    fileExists: (path) => sys.fileExists(path),
    readFile: (path) => sys.readFile(path),
    getCurrentDirectory: () => sys.getCurrentDirectory(),
    onUnRecoverableConfigFileDiagnostic: () => undefined,
  });

  if (parsed === undefined) {
    return undefined;
  }

  return {
    configFilePath,
    fileNames: parsed.fileNames,
    references: (parsed.projectReferences ?? []).map((reference) => resolveProjectReferencePath(reference)),
    options: parsed.options,
  };
};

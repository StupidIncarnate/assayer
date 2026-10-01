/**
 * PURPOSE: Finds the nearest `tsconfig.json` at or above a search path and reads it the way `tsc`
 * does, over `ts.sys`: `findConfigFile` up the tree, `readJsonConfigFile` for the raw text, then
 * `parseConfigFileTextToJson` and `parseJsonConfigFileContent` for the compiler options, `extends`
 * chain included. Returns the config path, its raw text and its options, or `undefined` when no
 * tsconfig exists above the search path. This is the seam a test stages through `readNearestTsconfigProxy`, because `ts.sys`
 * reads the real disk and nothing else can stage it.
 *
 * USAGE:
 * readNearestTsconfig({ searchPath: '/repo' });
 * // Returns { configFilePath: '/repo/tsconfig.json', text: '{ ... }', options: { strict: true } }, or undefined
 */
import { dirname } from 'path';
import {
  findConfigFile,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  readJsonConfigFile,
  sys,
} from 'typescript';
import type { CompilerOptions } from 'typescript';

export const readNearestTsconfig = ({
  searchPath,
}: {
  searchPath: string;
}): { configFilePath: string; text: string; options: CompilerOptions } | undefined => {
  const configFilePath = findConfigFile(searchPath, (file) => sys.fileExists(file), 'tsconfig.json');

  if (configFilePath === undefined) {
    return undefined;
  }

  const sourceFile = readJsonConfigFile(configFilePath, (path) => sys.readFile(path));

  // A tsconfig that exists but cannot be read (EACCES) comes back as a bare diagnostic holder with no
  // `text`. It reads as empty text, which parses to empty options.
  const text = 'text' in sourceFile ? sourceFile.text : '';
  // The text parses to a JSON object first, the same parse `readConfigFile` runs, so the options match
  // what `readConfigFile` plus `parseJsonConfigFileContent` return for the same file.
  const json: unknown = parseConfigFileTextToJson(configFilePath, text).config ?? {};
  const parsed = parseJsonConfigFileContent(json, sys, dirname(configFilePath));

  return { configFilePath, text, options: parsed.options };
};

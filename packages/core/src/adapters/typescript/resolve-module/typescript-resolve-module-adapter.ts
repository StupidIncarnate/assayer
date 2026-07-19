/**
 * PURPOSE: Resolves one module specifier against a containing file with the npm `typescript`
 *   resolver (`resolveModuleName` over `ts.sys`) — the same algorithm `tsc` runs, so relative
 *   spellings and path aliases collapse to one canonical file. Returns the resolved absolute file
 *   name when TypeScript finds one, or `{ resolved: false }` when the specifier points at nothing (a
 *   broken import). The caller classifies local vs package from the file name; builtins are matched by
 *   name upstream because they do not resolve without ambient node types.
 *
 * USAGE:
 * typescriptResolveModuleAdapter({ specifier: '../b/foo', containingFile: '/repo/src/a/x.ts', options });
 * // Returns { resolved: true, fileName: '/repo/src/b/foo.ts' } or { resolved: false }
 */
import ts from 'typescript';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const typescriptResolveModuleAdapter = ({
  specifier,
  containingFile,
  options,
}: {
  specifier: string;
  containingFile: string;
  options: ts.CompilerOptions;
}): { resolved: false } | { resolved: true; fileName: FilePath } => {
  const result = ts.resolveModuleName(specifier, containingFile, options, ts.sys);
  const {resolvedModule} = result;

  if (resolvedModule === undefined) {
    return { resolved: false };
  }

  return { resolved: true, fileName: filePathContract.parse(resolvedModule.resolvedFileName) };
};

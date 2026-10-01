/**
 * PURPOSE: Resolves one module specifier against a containing file with the npm `typescript`
 *   resolver, through the gateway's `resolveModuleFile` — the same algorithm `tsc` runs, so relative
 *   spellings and path aliases collapse to one canonical file. Returns the resolved absolute file
 *   name when TypeScript finds one, or `{ resolved: false }` when the specifier points at nothing (a
 *   broken import). The caller classifies local vs package from the file name; builtins are matched by
 *   name upstream because they do not resolve without ambient node types.
 *
 * USAGE:
 * importSpecifierResolveBroker({ specifier: '../b/foo', containingFile: '/repo/src/a/x.ts', options });
 * // Returns { resolved: true, fileName: '/repo/src/b/foo.ts' } or { resolved: false }
 */
import { importSpecifierResolveResultContract } from '../../../contracts/import-specifier-resolve-result/import-specifier-resolve-result-contract';
import type { ImportSpecifierResolveResult } from '../../../contracts/import-specifier-resolve-result/import-specifier-resolve-result-contract';
import { resolveModuleFile } from '#gateway/npm/typescript';
import type { CompilerOptions } from '#gateway/npm/typescript';

export const importSpecifierResolveBroker = ({
  specifier,
  containingFile,
  options,
}: {
  specifier: string;
  containingFile: string;
  options: CompilerOptions;
}): ImportSpecifierResolveResult => {
  const fileName = resolveModuleFile({ specifier, containingFile, options });

  if (fileName === undefined) {
    return importSpecifierResolveResultContract.parse({ resolved: false });
  }

  return importSpecifierResolveResultContract.parse({ resolved: true, fileName });
};

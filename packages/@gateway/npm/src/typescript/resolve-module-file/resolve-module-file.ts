/**
 * PURPOSE: Resolves one module specifier against a containing file to the absolute file TypeScript
 * picks for it, by running `resolveModuleName` over `ts.sys`, the same algorithm and the same disk
 * view `tsc` uses. It returns `undefined` when TypeScript finds no file. This is the seam a test
 * stages through `resolveModuleFileProxy`, because `ts.sys` reads the real disk and nothing else can
 * stage it.
 *
 * USAGE:
 * resolveModuleFile({ specifier: '../b/foo', containingFile: '/repo/src/a/x.ts', options: {} });
 * // Returns '/repo/src/b/foo.ts', or undefined when the specifier points at nothing
 */
import { resolveModuleName, sys } from 'typescript';
import type { CompilerOptions } from 'typescript';

export const resolveModuleFile = ({
  specifier,
  containingFile,
  options,
}: {
  specifier: string;
  containingFile: string;
  options: CompilerOptions;
}): string | undefined =>
  resolveModuleName(specifier, containingFile, options, sys).resolvedModule?.resolvedFileName;

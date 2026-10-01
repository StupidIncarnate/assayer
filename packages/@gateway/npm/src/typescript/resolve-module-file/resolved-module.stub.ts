/**
 * PURPOSE: The value `typescript`'s `resolveModuleName` returns, for a proxy staging that call. Pass a
 * `resolvedFileName` for a specifier TypeScript finds, and omit it for a specifier that points at
 * nothing, which TypeScript reports as an undefined `resolvedModule`.
 *
 * USAGE:
 * ResolvedModuleStub({ resolvedFileName: '/repo/src/b/foo.ts' });
 * // Returns { resolvedModule: { resolvedFileName: '/repo/src/b/foo.ts', extension: '.ts', isExternalLibraryImport: false } }
 */
import type { ResolvedModuleWithFailedLookupLocations } from 'typescript';

export const ResolvedModuleStub = ({
  resolvedFileName,
  extension = '.ts',
  isExternalLibraryImport = false,
}: {
  resolvedFileName?: string;
  extension?: string;
  isExternalLibraryImport?: boolean;
} = {}): ResolvedModuleWithFailedLookupLocations => ({
  resolvedModule:
    resolvedFileName === undefined ? undefined : { resolvedFileName, extension, isExternalLibraryImport },
});

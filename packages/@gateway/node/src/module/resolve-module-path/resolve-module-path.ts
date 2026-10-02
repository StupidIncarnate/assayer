/**
 * PURPOSE: Resolves a module specifier to its absolute file path, the way a `require` inside the file
 * at `fromPath` would. Reach for this over `resolvePackageRoot` when a package needs a file another
 * package exports, such as a built page: the walk starts at the caller's own file, so it finds the
 * caller's own declared dependency in every install layout, hoisted or nested, and it honors the
 * target package's `exports` map. `resolvePackageRoot` walks from this gateway's location instead
 * and returns only a package's root folder.
 *
 * USAGE:
 * resolveModulePath({ specifier: '@assayer/app/page', fromPath: __filename });
 * // Returns '/repo/node_modules/@assayer/app/dist/index.html' with symlinks resolved;
 * // throws Node's own MODULE_NOT_FOUND error when nothing resolves.
 */

import { createRequire } from 'module';

export const resolveModulePath = ({
  specifier,
  fromPath,
}: {
  specifier: string;
  fromPath: string;
}): string => {
  const resolvedPath: string = createRequire(fromPath).resolve(specifier);

  return resolvedPath;
};

/**
 * PURPOSE: Finds the folder that holds TypeScript's own lib files (`lib.es2022.d.ts` and the rest) inside
 * the installed `typescript` package. The compiler bundled with the gateway keeps its lib files in memory,
 * not on disk, so every program the generator builds over a compiler host points at this folder instead.
 * Reach for it from any broker that creates a compiler host.
 *
 * USAGE:
 * typescriptLibLocateBroker();
 * // Returns '/repo/node_modules/typescript/lib', or null when the typescript package is not installed
 */
import { resolvePackageRoot } from '#gateway/node/module';
import { join } from '#gateway/node/path';

export const typescriptLibLocateBroker = (): string | null => {
  const typescriptRoot = resolvePackageRoot({ specifier: 'typescript' });
  return typescriptRoot === null ? null : join(typescriptRoot, 'lib');
};

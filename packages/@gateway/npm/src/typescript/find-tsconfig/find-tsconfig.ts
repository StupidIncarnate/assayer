/**
 * PURPOSE: Finds the path of the nearest `tsconfig.json` at or above a folder, the way `tsc` and
 * tsserver find it, over `ts.sys`. Reach for this, not `readNearestTsconfig`, when the caller needs
 * only the path, for example to climb past a config that does not own a file. A test stages it through
 * `findTsconfigProxy`, because `ts.sys` reads the real disk.
 *
 * USAGE:
 * findTsconfig({ searchPath: '/repo/packages/app/src' });
 * // Returns '/repo/packages/app/tsconfig.json', or undefined when no tsconfig.json is above the folder
 */
import { findConfigFile, sys } from '../bundled-typescript/bundled-typescript';

export const findTsconfig = ({ searchPath }: { searchPath: string }): string | undefined =>
  findConfigFile(searchPath, (file) => sys.fileExists(file), 'tsconfig.json');

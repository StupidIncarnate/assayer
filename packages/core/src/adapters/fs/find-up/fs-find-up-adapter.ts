/**
 * PURPOSE: Finds the nearest ancestor directory containing a marker file, walking UP from a starting
 *   directory. Find-up rather than a counted `../..` because the same module runs from BOTH `src`
 *   (ts-jest, tsx) and `dist`, whose extra level silently shifts every fixed relative path — the
 *   trap `analyzer-roots-resolve-adapter` already documents.
 *
 *   Returns undefined when no ancestor carries the marker, so a caller must say what that means
 *   rather than receive a wrong path that looks right.
 *
 * USAGE:
 * fsFindUpAdapter({ from: __dirname, marker: 'probe-runtime.js' });
 * // Returns the directory holding probe-runtime.js, or undefined
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsFindUpAdapter = ({ from, marker }: { from: string; marker: string }): FilePath | undefined => {
  if (existsSync(join(from, marker))) {
    return filePathContract.parse(from);
  }

  const parent = dirname(from);

  if (parent === from) {
    return undefined;
  }

  return fsFindUpAdapter({ from: parent, marker });
};

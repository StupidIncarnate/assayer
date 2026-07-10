/**
 * PURPOSE: Extracts the parent directory from a path, mirroring node:path's dirname()
 *   semantics (deterministic — no mocking needed).
 *
 * USAGE:
 * pathDirnameAdapter({ path: '/repo/packages/core' });
 * // Returns a validated FilePath: '/repo/packages'
 */
import { dirname } from 'node:path';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathDirnameAdapter = ({ path }: { path: string }): FilePath =>
  filePathContract.parse(dirname(path));

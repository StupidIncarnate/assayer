/**
 * PURPOSE: Extracts the final path segment (basename) from a path, mirroring node:path's
 *   basename() semantics (deterministic — no mocking needed).
 *
 * USAGE:
 * pathBasenameAdapter({ path: '/repo/smoke-repo' });
 * // Returns a validated FilePath: 'smoke-repo'
 */
import { basename } from 'node:path';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathBasenameAdapter = ({ path }: { path: string }): FilePath =>
  filePathContract.parse(basename(path));

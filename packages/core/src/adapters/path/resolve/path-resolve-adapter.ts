/**
 * PURPOSE: Resolves a sequence of path segments into an absolute FilePath, mirroring
 *   node:path's resolve() semantics (deterministic — no mocking needed).
 *
 * USAGE:
 * pathResolveAdapter({ segments: ['/repo', 'smoke-repo'] });
 * // Returns a validated FilePath: '/repo/smoke-repo'
 */
import { resolve } from 'node:path';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathResolveAdapter = ({ segments }: { segments: readonly string[] }): FilePath =>
  filePathContract.parse(resolve(...segments));

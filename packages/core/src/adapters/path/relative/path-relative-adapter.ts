/**
 * PURPOSE: Computes the relative path from one absolute path to another, mirroring
 *   node:path's relative() semantics (deterministic — no mocking needed).
 *
 * USAGE:
 * pathRelativeAdapter({ from: '/repo', to: '/repo/packages/web/index.tsx' });
 * // Returns a validated RelPath: 'packages/web/index.tsx'
 */
import { relative } from 'node:path';
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

export const pathRelativeAdapter = ({ from, to }: { from: string; to: string }): RelPath =>
  relPathContract.parse(relative(from, to));

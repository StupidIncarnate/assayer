/**
 * PURPOSE: Contract for a compile-progress event — reports how far a branch-keyed manifest
 *   index build has advanced, for streaming progress to a consumer (e.g. a CLI progress bar).
 *
 * USAGE:
 * compileProgressEventContract.parse({
 *   namespace: 'master',
 *   branch: 'master',
 *   phase: 'advanced',
 *   current: 2,
 *   max: 5,
 *   stableMax: 3,
 *   currentMax: 5,
 * });
 * // Returns a validated CompileProgressEvent (branded fields)
 */
import { z } from 'zod';

import { namespaceNameContract, branchNameContract, fileCountContract } from '@assayer/shared/contracts';

// Supporting phase schema (kept local, non-exported const; export only the type)
const compileProgressPhaseContract = z.enum(['planned', 'advanced', 'done']).brand<'CompileProgressPhase'>();
export type CompileProgressPhase = z.infer<typeof compileProgressPhaseContract>;

export const compileProgressEventContract = z.object({
  // namespace: which branch-keyed manifest index this progress reports on
  namespace: namespaceNameContract,
  // branch: the git branch (or 'default'/'detached-<sha>')
  branch: branchNameContract,
  // phase: lifecycle stage of the compile — 'planned' | 'advanced' | 'done'
  phase: compileProgressPhaseContract,
  // current: files processed so far
  current: fileCountContract,
  // max: total files planned (0 when skipped)
  max: fileCountContract,
  // stableMax: pre-counted total for the stable namespace
  stableMax: fileCountContract,
  // currentMax: pre-counted total for the current namespace
  currentMax: fileCountContract,
});
export type CompileProgressEvent = z.infer<typeof compileProgressEventContract>;

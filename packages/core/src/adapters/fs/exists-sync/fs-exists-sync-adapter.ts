/**
 * PURPOSE: Checks whether a path exists on disk SYNCHRONOUSLY using node's `existsSync`.
 *
 *   The synchronous check exists for the analysis-time callers that cannot await: the consume-time
 *   overlays run inside the synchronous projection chain that produces a FileAnalysis, and a colocated
 *   harness is ABSENT for almost every file — so "is there one" is asked far more often than it is
 *   answered yes, and asking by catching a read's ENOENT would turn the ordinary case into an error path.
 *
 * USAGE:
 * const found = fsExistsSyncAdapter({ path: '/repo/src/audit.harness.ts' });
 * // Returns true when the path exists, false otherwise (never throws)
 */
import { existsSync } from 'fs';

export const fsExistsSyncAdapter = ({ path }: { path: string }): boolean => existsSync(path);

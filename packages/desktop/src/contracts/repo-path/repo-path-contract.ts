/**
 * PURPOSE: Branded contract for the target repository path the desktop app was launched
 *   against (the cwd of the `assayer` invocation).
 *
 * USAGE:
 * repoPathContract.parse('/home/user/project');
 * // Returns a branded RepoPath
 */
import { z } from 'zod';

export const repoPathContract = z.string().min(1).brand<'RepoPath'>();

export type RepoPath = z.infer<typeof repoPathContract>;

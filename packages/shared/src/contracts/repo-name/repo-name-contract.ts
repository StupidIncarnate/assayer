/**
 * PURPOSE: Contract for a repo name — a non-empty identifier for the TypeScript repo
 *   Assayer is analyzing.
 *
 * USAGE:
 * const name = repoNameContract.parse('assayer');
 * // Returns a validated RepoName (branded)
 */
import { z } from 'zod';

export const repoNameContract = z.string().min(1).brand<'RepoName'>();

export type RepoName = z.infer<typeof repoNameContract>;

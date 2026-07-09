/**
 * PURPOSE: Contract for a git branch name, non-empty (also covers detached-HEAD placeholders
 *   like `detached-<sha>`).
 *
 * USAGE:
 * const branch = branchNameContract.parse('master');
 * // Returns a validated BranchName (branded)
 */
import { z } from 'zod';

export const branchNameContract = z.string().min(1).brand<'BranchName'>();

export type BranchName = z.infer<typeof branchNameContract>;

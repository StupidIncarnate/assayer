/**
 * PURPOSE: Contract for a namespace name that scopes cached derived artifacts (e.g. per git
 *   ref/worktree), non-empty.
 *
 * USAGE:
 * const namespace = namespaceNameContract.parse('master');
 * // Returns a validated NamespaceName (branded)
 */
import { z } from 'zod';

export const namespaceNameContract = z.string().min(1).brand<'NamespaceName'>();

export type NamespaceName = z.infer<typeof namespaceNameContract>;

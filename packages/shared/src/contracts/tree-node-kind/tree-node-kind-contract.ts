/**
 * PURPOSE: Contract for the kind of a tree node — whether a node in the analyzed repo's file
 *   tree is a directory or a file.
 *
 * USAGE:
 * const kind = treeNodeKindContract.parse('dir');
 * // Returns a validated TreeNodeKind (branded)
 */
import { z } from 'zod';

export const treeNodeKindContract = z.enum(['dir', 'file']).brand<'TreeNodeKind'>();

export type TreeNodeKind = z.infer<typeof treeNodeKindContract>;

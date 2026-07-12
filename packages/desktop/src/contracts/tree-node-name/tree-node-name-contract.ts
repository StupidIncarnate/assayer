/**
 * PURPOSE: Contract for a tree node display name — a non-empty segment name (directory or file)
 *   shown in the desktop app's compiled file-tree explorer.
 *
 * USAGE:
 * treeNodeNameContract.parse('index.ts');
 * // Returns a validated TreeNodeName (branded)
 */
import { z } from 'zod';

export const treeNodeNameContract = z.string().min(1).brand<'TreeNodeName'>();

export type TreeNodeName = z.infer<typeof treeNodeNameContract>;

/**
 * PURPOSE: Contract for the compiled file tree of an analyzed repo — a recursive tree of
 *   directory/file nodes plus a summary of repo/branch/root-folder identity and TS file counts.
 *
 * USAGE:
 * compiledTreeContract.parse({
 *   summary: { repoName: 'assayer', branchName: 'master', rootFolderName: 'smoke-repo', tsCount: 1, tsxCount: 0 },
 *   nodes: [{ name: 'src', path: 'packages/shared/src', kind: 'dir', children: [] }],
 * });
 * // Returns a validated CompiledTree (recursive children, branded fields)
 */
import { z } from '#gateway/npm/zod';

import { treeNodeKindContract } from '../tree-node-kind/tree-node-kind-contract';

export interface TreeNode {
  name: string & z.core.$brand<'TreeNodeName'>;
  path: string;
  kind: z.infer<typeof treeNodeKindContract>;
  children?: TreeNode[] | undefined;
  errorCount?: number | undefined;
}

// `children` is a getter whose return type wraps `z.core.$ZodType<TreeNode>`, so the lookup of
// the node contract below waits until a parse runs.
const treeNodeContract: z.ZodType<TreeNode> = z.object({
  name: z.string().min(1).brand<'TreeNodeName'>(),
  path: z.string().min(1).brand<'TreeNodePath'>(),
  kind: treeNodeKindContract,
  errorCount: z.number().int().nonnegative().brand<'TreeNodeErrorCount'>().optional(),
  get children(): z.ZodOptional<z.ZodArray<z.core.$ZodType<TreeNode>>> {
    return z.array(treeNodeContract).optional();
  },
}).brand<'TreeNode'>();

export const compiledTreeContract = z.object({
  summary: z.object({
    repoName: z.string().min(1).brand<'CompiledTreeSummaryRepoName'>(),
    branchName: z.string().min(1).brand<'CompiledTreeSummaryBranchName'>(),
    rootFolderName: z.string().min(1).brand<'CompiledTreeSummaryRootFolderName'>(),
    tsCount: z.number().int().nonnegative().brand<'CompiledTreeSummaryTsCount'>(),
    tsxCount: z.number().int().nonnegative().brand<'CompiledTreeSummaryTsxCount'>(),
  }).brand<'CompiledTreeSummary'>(),
  nodes: z.array(treeNodeContract),
}).brand<'CompiledTree'>();

export type CompiledTree = z.infer<typeof compiledTreeContract>;

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
import { z } from 'zod';

import { repoNameContract } from '../repo-name/repo-name-contract';
import { namespaceNameContract } from '../namespace-name/namespace-name-contract';
import { folderNameContract } from '../folder-name/folder-name-contract';
import { fileCountContract } from '../file-count/file-count-contract';
import { treeNodeKindContract } from '../tree-node-kind/tree-node-kind-contract';
import { relPathContract } from '../rel-path/rel-path-contract';

const treeNodeNameContract = z.string().min(1).brand<'TreeNodeName'>();

export interface TreeNode {
  name: z.infer<typeof treeNodeNameContract>;
  path: z.infer<typeof relPathContract>;
  kind: z.infer<typeof treeNodeKindContract>;
  children?: TreeNode[] | undefined;
}

const treeNodeContract: z.ZodType<TreeNode, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    name: treeNodeNameContract,
    path: relPathContract,
    kind: treeNodeKindContract,
    children: z.array(treeNodeContract).optional(),
  }),
);

export const compiledTreeContract = z.object({
  summary: z.object({
    repoName: repoNameContract,
    branchName: namespaceNameContract,
    rootFolderName: folderNameContract,
    tsCount: fileCountContract,
    tsxCount: fileCountContract,
  }),
  nodes: z.array(treeNodeContract),
});

export type CompiledTree = z.infer<typeof compiledTreeContract>;

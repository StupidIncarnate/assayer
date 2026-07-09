import { treeNodeKindContract } from './tree-node-kind-contract';
import type { TreeNodeKind } from './tree-node-kind-contract';

export const TreeNodeKindStub = (
  { value }: { value: string } = { value: 'dir' },
): TreeNodeKind => treeNodeKindContract.parse(value);

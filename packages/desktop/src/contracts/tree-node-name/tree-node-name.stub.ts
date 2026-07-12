import { treeNodeNameContract } from './tree-node-name-contract';
import type { TreeNodeName } from './tree-node-name-contract';

export const TreeNodeNameStub = ({ value }: { value: string } = { value: 'index.ts' }): TreeNodeName =>
  treeNodeNameContract.parse(value);

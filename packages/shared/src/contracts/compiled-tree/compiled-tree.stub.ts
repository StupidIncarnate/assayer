import type { StubArgument } from '@dungeonmaster/shared/@types';

import { compiledTreeContract } from './compiled-tree-contract';
import type { CompiledTree } from './compiled-tree-contract';

export const CompiledTreeStub = ({ ...props }: StubArgument<CompiledTree> = {}): CompiledTree =>
  compiledTreeContract.parse({
    summary: {
      repoName: 'assayer',
      branchName: 'master',
      rootFolderName: 'smoke-repo',
      tsCount: 1,
      tsxCount: 0,
    },
    nodes: [
      {
        name: 'src',
        path: 'packages/shared/src',
        kind: 'dir',
        children: [{ name: 'index.ts', path: 'packages/shared/src/index.ts', kind: 'file' }],
      },
    ],
    ...props,
  });

import { CompiledTreeStub } from '@assayer/shared/contracts/compiled-tree/compiled-tree.stub';
import { treeFilePathsTransformer } from './tree-file-paths-transformer';

describe('treeFilePathsTransformer', () => {
  describe('file node', () => {
    it('VALID: {node: file} => returns array with its path', () => {
      const tree = CompiledTreeStub({
        nodes: [{ name: 'index.ts', path: 'src/index.ts', kind: 'file' }],
      });

      const results = tree.nodes.flatMap((node) => treeFilePathsTransformer({ node }));

      expect(results).toStrictEqual(['src/index.ts']);
    });
  });

  describe('directory node', () => {
    it('EMPTY: {node: dir with empty children} => returns empty array', () => {
      const tree = CompiledTreeStub({
        nodes: [{ name: 'empty', path: 'empty', kind: 'dir', children: [] }],
      });

      const results = tree.nodes.flatMap((node) => treeFilePathsTransformer({ node }));

      expect(results).toStrictEqual([]);
    });

    it('VALID: {node: dir with nested structure} => extracts all file paths in DFS order', () => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'packages',
            path: 'packages',
            kind: 'dir',
            children: [
              { name: 'root.ts', path: 'packages/root.ts', kind: 'file' },
              {
                name: 'app',
                path: 'packages/app',
                kind: 'dir',
                children: [
                  { name: 'app.tsx', path: 'packages/app/app.tsx', kind: 'file' },
                  {
                    name: 'sub',
                    path: 'packages/app/sub',
                    kind: 'dir',
                    children: [
                      { name: 'sub.ts', path: 'packages/app/sub/sub.ts', kind: 'file' },
                    ],
                  },
                ],
              },
              {
                name: 'core',
                path: 'packages/core',
                kind: 'dir',
                children: [
                  { name: 'main.ts', path: 'packages/core/main.ts', kind: 'file' },
                ],
              },
              { name: 'final.ts', path: 'packages/final.ts', kind: 'file' },
            ],
          },
        ],
      });

      const results = tree.nodes.flatMap((node) => treeFilePathsTransformer({ node }));

      expect(results).toStrictEqual([
        'packages/root.ts',
        'packages/app/app.tsx',
        'packages/app/sub/sub.ts',
        'packages/core/main.ts',
        'packages/final.ts',
      ]);
    });
  });
});

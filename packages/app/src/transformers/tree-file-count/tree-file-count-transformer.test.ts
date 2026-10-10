import { CompiledTreeStub } from '@assayer/shared/contracts/compiled-tree/compiled-tree.stub';
import { treeFileCountTransformer } from './tree-file-count-transformer';

describe('treeFileCountTransformer', () => {
  describe('file node', () => {
    it('VALID: {node: file} => returns 1', () => {
      const tree = CompiledTreeStub({
        nodes: [{ name: 'index.ts', path: 'src/index.ts', kind: 'file' }],
      });

      const results = tree.nodes.map((node) => treeFileCountTransformer({ node }));

      expect(results).toStrictEqual([1]);
    });
  });

  describe('directory node', () => {
    it('EMPTY: {node: dir with empty children} => returns 0', () => {
      const tree = CompiledTreeStub({
        nodes: [{ name: 'empty', path: 'empty', kind: 'dir', children: [] }],
      });

      const results = tree.nodes.map((node) => treeFileCountTransformer({ node }));

      expect(results).toStrictEqual([0]);
    });

    it('VALID: {node: dir with 3 direct file children} => returns 3', () => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'src',
            path: 'src',
            kind: 'dir',
            children: [
              { name: 'a.ts', path: 'src/a.ts', kind: 'file' },
              { name: 'b.ts', path: 'src/b.ts', kind: 'file' },
              { name: 'c.ts', path: 'src/c.ts', kind: 'file' },
            ],
          },
        ],
      });

      const results = tree.nodes.map((node) => treeFileCountTransformer({ node }));

      expect(results).toStrictEqual([3]);
    });

    it('VALID: {node: dir with nested directories and files} => returns total count recursively', () => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'packages',
            path: 'packages',
            kind: 'dir',
            children: [
              {
                name: 'app',
                path: 'packages/app',
                kind: 'dir',
                children: [
                  { name: 'index.ts', path: 'packages/app/index.ts', kind: 'file' },
                  { name: 'app.tsx', path: 'packages/app/app.tsx', kind: 'file' },
                ],
              },
              {
                name: 'core',
                path: 'packages/core',
                kind: 'dir',
                children: [
                  { name: 'main.ts', path: 'packages/core/main.ts', kind: 'file' },
                  {
                    name: 'nested',
                    path: 'packages/core/nested',
                    kind: 'dir',
                    children: [
                      { name: 'deep.ts', path: 'packages/core/nested/deep.ts', kind: 'file' },
                      { name: 'empty-sub', path: 'packages/core/nested/empty-sub', kind: 'dir', children: [] },
                    ],
                  },
                ],
              },
              { name: 'empty-pkg', path: 'packages/empty-pkg', kind: 'dir', children: [] },
            ],
          },
        ],
      });

      const results = tree.nodes.map((node) => treeFileCountTransformer({ node }));

      expect(results).toStrictEqual([4]);
    });
  });
});


import { treeNodesTransformer } from './tree-nodes-transformer';

describe('treeNodesTransformer', () => {
  describe('building nested directories', () => {
    it('VALID: {relPaths: ["packages/shared/src/index.ts"]} => returns nested dir/file tree', () => {
      const relPaths = ['packages/shared/src/index.ts'];

      const result = treeNodesTransformer({ relPaths });

      expect(result).toStrictEqual([
        {
          name: 'packages',
          path: 'packages',
          kind: 'dir',
          children: [
            {
              name: 'shared',
              path: 'packages/shared',
              kind: 'dir',
              children: [
                {
                  name: 'src',
                  path: 'packages/shared/src',
                  kind: 'dir',
                  children: [{ name: 'index.ts', path: 'packages/shared/src/index.ts', kind: 'file' }],
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe('sorting siblings', () => {
    it('VALID: {relPaths: ["a.ts", "b.ts"]} => returns alphabetically sorted file nodes', () => {
      const relPaths = ['a.ts', 'b.ts'];

      const result = treeNodesTransformer({ relPaths });

      expect(result).toStrictEqual([
        { name: 'a.ts', path: 'a.ts', kind: 'file' },
        { name: 'b.ts', path: 'b.ts', kind: 'file' },
      ]);
    });

    it('VALID: {relPaths: ["dir/one.ts", "dir/two.ts"]} => returns dir node with sorted file children', () => {
      const relPaths = ['dir/one.ts', 'dir/two.ts'];

      const result = treeNodesTransformer({ relPaths });

      expect(result).toStrictEqual([
        {
          name: 'dir',
          path: 'dir',
          kind: 'dir',
          children: [
            { name: 'one.ts', path: 'dir/one.ts', kind: 'file' },
            { name: 'two.ts', path: 'dir/two.ts', kind: 'file' },
          ],
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {relPaths: []} => returns empty array', () => {
      const result = treeNodesTransformer({ relPaths: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error counts', () => {
    it('VALID: {errorCountsByPath with positive count} => adds errorCount to file node', () => {
      const relPaths = ['packages/shared/src/index.ts', 'packages/shared/src/empty.ts'];
      const errorCountsByPath = new Map([
        ['packages/shared/src/index.ts', 3],
        ['packages/shared/src/empty.ts', 0],
      ]);

      const result = treeNodesTransformer({ relPaths, errorCountsByPath });

      expect(result[0]?.children?.[0]?.children?.[0]?.children).toStrictEqual([
        { name: 'empty.ts', path: 'packages/shared/src/empty.ts', kind: 'file' },
        { name: 'index.ts', path: 'packages/shared/src/index.ts', kind: 'file', errorCount: 3 },
      ]);
    });
  });
});

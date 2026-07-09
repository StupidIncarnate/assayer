import { compiledTreeContract } from './compiled-tree-contract';
import { CompiledTreeStub } from './compiled-tree.stub';

describe('compiledTreeContract', () => {
  describe('valid compiled trees', () => {
    it('VALID: {stub with nested dir/file children} => parses recursive children', () => {
      const result = compiledTreeContract.parse(CompiledTreeStub());

      expect(result.nodes[0]?.children?.[0]?.name).toBe('index.ts');
    });

    it('VALID: {node without children key} => parses without a children property', () => {
      const result = compiledTreeContract.parse({
        summary: {
          repoName: 'assayer',
          branchName: 'master',
          rootFolderName: 'smoke-repo',
          tsCount: 1,
          tsxCount: 0,
        },
        nodes: [{ name: 'index.ts', path: 'packages/shared/src/index.ts', kind: 'file' }],
      });

      expect(result.nodes[0]).toStrictEqual({
        name: 'index.ts',
        path: 'packages/shared/src/index.ts',
        kind: 'file',
      });
    });
  });

  describe('invalid compiled trees', () => {
    it('INVALID: {kind: "symlink"} => throws validation error', () => {
      expect(() => {
        return compiledTreeContract.parse({
          summary: {
            repoName: 'assayer',
            branchName: 'master',
            rootFolderName: 'smoke-repo',
            tsCount: 1,
            tsxCount: 0,
          },
          nodes: [{ name: 'weird', path: 'packages/shared/src/weird', kind: 'symlink' }],
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});

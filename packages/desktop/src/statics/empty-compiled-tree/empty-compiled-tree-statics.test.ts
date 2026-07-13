import { emptyCompiledTreeStatics } from './empty-compiled-tree-statics';

describe('emptyCompiledTreeStatics', () => {
  describe('placeholder summary', () => {
    it('VALID: summary => contract-valid default identity segments and zero counts', () => {
      expect(emptyCompiledTreeStatics.summary).toStrictEqual({
        repoName: 'default',
        branchName: 'default',
        rootFolderName: 'default',
        tsCount: 0,
        tsxCount: 0,
      });
    });
  });
});

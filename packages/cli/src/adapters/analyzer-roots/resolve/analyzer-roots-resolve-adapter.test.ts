import { FilePathStub } from '@assayer/core/contracts';

import { analyzerRootsResolveAdapter } from './analyzer-roots-resolve-adapter';
import { analyzerRootsResolveAdapterProxy } from './analyzer-roots-resolve-adapter.proxy';

describe('analyzerRootsResolveAdapter', () => {
  describe('resolving the analyzer source roots', () => {
    it('VALID: {default from = this module, inside the monorepo} => the core and shared src roots', () => {
      analyzerRootsResolveAdapterProxy();

      const roots = analyzerRootsResolveAdapter().map((root) => String(root).split('/').slice(-3).join('/'));

      expect(roots).toStrictEqual(['packages/core/src', 'packages/shared/src']);
    });

    it('EMPTY: {from a path outside any monorepo} => no roots', () => {
      analyzerRootsResolveAdapterProxy();

      const roots = analyzerRootsResolveAdapter({ from: FilePathStub({ value: '/nonexistent-xyz' }) });

      expect(roots).toStrictEqual([]);
    });
  });
});

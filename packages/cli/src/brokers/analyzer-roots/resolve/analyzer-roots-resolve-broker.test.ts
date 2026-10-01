import { FilePathStub } from '@assayer/core/contracts';

import { analyzerRootsResolveBroker } from './analyzer-roots-resolve-broker';
import { analyzerRootsResolveBrokerProxy } from './analyzer-roots-resolve-broker.proxy';

describe('analyzerRootsResolveBroker', () => {
  describe('resolving the analyzer source roots', () => {
    it('VALID: {default from = this module, inside the monorepo} => the core and shared src roots', () => {
      analyzerRootsResolveBrokerProxy();

      const roots = analyzerRootsResolveBroker().map((root) => String(root).split('/').slice(-3).join('/'));

      expect(roots).toStrictEqual(['packages/core/src', 'packages/shared/src']);
    });

    it('EMPTY: {from a path outside any monorepo} => no roots', () => {
      analyzerRootsResolveBrokerProxy();

      const roots = analyzerRootsResolveBroker({ from: FilePathStub({ value: '/nonexistent-xyz' }) });

      expect(roots).toStrictEqual([]);
    });
  });
});

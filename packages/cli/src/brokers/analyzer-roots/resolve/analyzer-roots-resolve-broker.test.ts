import { FilePathStub } from '@assayer/core/contracts';

import { analyzerRootsResolveBroker } from './analyzer-roots-resolve-broker';
import { analyzerRootsResolveBrokerProxy } from './analyzer-roots-resolve-broker.proxy';

describe('analyzerRootsResolveBroker', () => {
  describe('resolving the analyzer source roots', () => {
    it('VALID: {default from = this module, inside the monorepo} => the core and shared src roots', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAboveThisModule();

      const roots = analyzerRootsResolveBroker().map((root) => String(root).split('/').slice(-3).join('/'));

      expect(roots).toStrictEqual(['packages/core/src', 'packages/shared/src']);
    });

    it('VALID: {from two levels below the monorepo root} => walks up to the root and returns its core and shared src roots', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo/packages/cli', root: '/repo' });

      const roots = analyzerRootsResolveBroker({ from: FilePathStub({ value: '/repo/packages/cli' }) });

      expect(roots).toStrictEqual([
        FilePathStub({ value: '/repo/packages/core/src' }),
        FilePathStub({ value: '/repo/packages/shared/src' }),
      ]);
    });

    it('VALID: {from the monorepo root itself} => returns its core and shared src roots without walking up', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.rootAt({ from: '/repo', root: '/repo' });

      const roots = analyzerRootsResolveBroker({ from: FilePathStub({ value: '/repo' }) });

      expect(roots).toStrictEqual([
        FilePathStub({ value: '/repo/packages/core/src' }),
        FilePathStub({ value: '/repo/packages/shared/src' }),
      ]);
    });

    it('EMPTY: {from a path outside any monorepo} => no roots', () => {
      const proxy = analyzerRootsResolveBrokerProxy();
      proxy.noRootAbove({ from: '/nonexistent-xyz' });

      const roots = analyzerRootsResolveBroker({ from: FilePathStub({ value: '/nonexistent-xyz' }) });

      expect(roots).toStrictEqual([]);
    });
  });
});

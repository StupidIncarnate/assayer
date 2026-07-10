import { pathBasenameAdapter } from './path-basename-adapter';
import { pathBasenameAdapterProxy } from './path-basename-adapter.proxy';

describe('pathBasenameAdapter', () => {
  describe('extracting the basename', () => {
    it('VALID: {path: "/repo/smoke-repo"} => returns "smoke-repo"', () => {
      pathBasenameAdapterProxy();

      const result = pathBasenameAdapter({ path: '/repo/smoke-repo' });

      expect(result).toBe('smoke-repo');
    });
  });
});

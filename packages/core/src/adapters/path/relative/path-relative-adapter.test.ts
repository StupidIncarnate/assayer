import { pathRelativeAdapter } from './path-relative-adapter';
import { pathRelativeAdapterProxy } from './path-relative-adapter.proxy';

describe('pathRelativeAdapter', () => {
  describe('computing a relative path', () => {
    it('VALID: {from: "/repo", to: "/repo/packages/web/index.tsx"} => returns "packages/web/index.tsx"', () => {
      pathRelativeAdapterProxy();

      const result = pathRelativeAdapter({ from: '/repo', to: '/repo/packages/web/index.tsx' });

      expect(result).toBe('packages/web/index.tsx');
    });
  });
});

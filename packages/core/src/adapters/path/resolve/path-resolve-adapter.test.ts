import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';

describe('pathResolveAdapter', () => {
  describe('resolving path segments', () => {
    it('VALID: {segments: ["/repo"]} => returns "/repo"', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ segments: ['/repo'] });

      expect(result).toBe('/repo');
    });

    it('VALID: {segments: ["/repo", "smoke-repo"]} => returns "/repo/smoke-repo"', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ segments: ['/repo', 'smoke-repo'] });

      expect(result).toBe('/repo/smoke-repo');
    });

    it('EDGE: {segments: ["/already/absolute"]} => returns "/already/absolute" unchanged', () => {
      pathResolveAdapterProxy();

      const result = pathResolveAdapter({ segments: ['/already/absolute'] });

      expect(result).toBe('/already/absolute');
    });
  });
});

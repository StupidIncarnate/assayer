import { pathDirnameAdapter } from './path-dirname-adapter';
import { pathDirnameAdapterProxy } from './path-dirname-adapter.proxy';

describe('pathDirnameAdapter', () => {
  describe('extracting the parent directory', () => {
    it('VALID: {path: "/repo/packages/core"} => returns "/repo/packages"', () => {
      pathDirnameAdapterProxy();

      const result = pathDirnameAdapter({ path: '/repo/packages/core' });

      expect(result).toBe('/repo/packages');
    });

    it('EDGE: {path: "/"} => returns "/" unchanged (filesystem root is its own parent)', () => {
      pathDirnameAdapterProxy();

      const result = pathDirnameAdapter({ path: '/' });

      expect(result).toBe('/');
    });
  });
});

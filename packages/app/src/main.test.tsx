import { resolveModulePath } from '#gateway/node/module';
import path from '#gateway/node/path';

describe('main', () => {
  describe('module structure', () => {
    it('VALID: {} => side-effect-only Vite entry exists as a TypeScript file', () => {
      const resolved = resolveModulePath({ specifier: './main', fromPath: __filename });

      expect(resolved).toBe(path.resolve(__dirname, 'main.tsx'));
    });
  });
});

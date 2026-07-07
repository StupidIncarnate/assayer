import path from 'node:path';

describe('main', () => {
  describe('module structure', () => {
    it('VALID: {} => side-effect-only Vite entry exists as a TypeScript file', () => {
      const resolved = require.resolve('./main');

      expect(resolved).toBe(path.resolve(__dirname, 'main.tsx'));
    });
  });
});

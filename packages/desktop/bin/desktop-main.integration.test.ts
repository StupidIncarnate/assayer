import { resolveModulePath } from '#gateway/node/module';

describe('desktop-main bin', () => {
  describe('module structure', () => {
    it('VALID: {} => the Electron main entry resolves to a TypeScript file', () => {
      expect(resolveModulePath({ specifier: './desktop-main', fromPath: __filename })).toMatch(/^.+\/bin\/desktop-main\.ts$/u);
    });
  });
});

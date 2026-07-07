describe('desktop-main bin', () => {
  describe('module structure', () => {
    it('VALID: {} => the Electron main entry resolves to a TypeScript file', () => {
      expect(require.resolve('./desktop-main')).toMatch(/^.+\/bin\/desktop-main\.ts$/u);
    });
  });
});

describe('desktop-preload bin', () => {
  describe('module structure', () => {
    it('VALID: {} => the Electron preload entry resolves to a TypeScript file', () => {
      expect(require.resolve('./desktop-preload')).toMatch(/^.+\/bin\/desktop-preload\.ts$/u);
    });
  });
});

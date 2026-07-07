describe('assayer bin', () => {
  describe('module structure', () => {
    it('VALID: {} => the assayer CLI bin entry resolves to a TypeScript file', () => {
      expect(require.resolve('./assayer')).toMatch(/^.+\/bin\/assayer\.ts$/u);
    });
  });
});

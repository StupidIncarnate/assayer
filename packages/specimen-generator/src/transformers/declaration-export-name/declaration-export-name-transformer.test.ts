import { declarationExportNameTransformer } from './declaration-export-name-transformer';

describe('declarationExportNameTransformer', () => {
  describe('syntax files', () => {
    it('VALID: {fileName: gt.syntax.ts, kind: syntax} => returns gtSyntax', () => {
      const result = declarationExportNameTransformer({ fileName: 'gt.syntax.ts', kind: 'syntax' });

      expect(result).toBe('gtSyntax');
    });
  });

  describe('shim files', () => {
    it('VALID: {fileName: array-at.shim.ts, kind: shim} => returns arrayAtShim', () => {
      const result = declarationExportNameTransformer({ fileName: 'array-at.shim.ts', kind: 'shim' });

      expect(result).toBe('arrayAtShim');
    });

    it('VALID: {fileName: math-random-value.shim.ts, kind: shim} => joins every dash part', () => {
      const result = declarationExportNameTransformer({ fileName: 'math-random-value.shim.ts', kind: 'shim' });

      expect(result).toBe('mathRandomValueShim');
    });
  });

  describe('container files', () => {
    it('VALID: {fileName: function-declaration.container.ts, kind: container} => returns functionDeclarationContainer', () => {
      const result = declarationExportNameTransformer({
        fileName: 'function-declaration.container.ts',
        kind: 'container',
      });

      expect(result).toBe('functionDeclarationContainer');
    });

    it('VALID: {fileName: class.container.ts, kind: container} => returns classContainer', () => {
      const result = declarationExportNameTransformer({ fileName: 'class.container.ts', kind: 'container' });

      expect(result).toBe('classContainer');
    });
  });

  describe('files with a folder path', () => {
    it('VALID: {fileName: declarations/syntax/eq.syntax.ts, kind: syntax} => ignores the folders', () => {
      const result = declarationExportNameTransformer({
        fileName: 'declarations/syntax/eq.syntax.ts',
        kind: 'syntax',
      });

      expect(result).toBe('eqSyntax');
    });
  });

  describe('empty names', () => {
    it('EMPTY: {fileName: .syntax.ts, kind: syntax} => returns only the capitalized kind', () => {
      const result = declarationExportNameTransformer({ fileName: '.syntax.ts', kind: 'syntax' });

      expect(result).toBe('Syntax');
    });
  });
});

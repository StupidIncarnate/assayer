import { compileErrorMessageFormatTransformer } from './compile-error-message-format-transformer';

describe('compileErrorMessageFormatTransformer', () => {
  describe('single error', () => {
    it('VALID: {errors: [{relPath: "src/foo.ts", line: 10, column: 4, message: "Unexpected token"}]} => returns "src/foo.ts:10:4 Unexpected token"', () => {
      const result = compileErrorMessageFormatTransformer({
        errors: [{ relPath: 'src/foo.ts', line: 10, column: 4, message: 'Unexpected token' }],
      });

      expect(result).toBe('src/foo.ts:10:4 Unexpected token');
    });
  });

  describe('multiple errors', () => {
    it('EDGE: {errors: [src/foo.ts, src/bar.ts]} => returns both lines joined by newline in order', () => {
      const result = compileErrorMessageFormatTransformer({
        errors: [
          { relPath: 'src/foo.ts', line: 10, column: 4, message: 'Unexpected token' },
          { relPath: 'src/bar.ts', line: 2, column: 1, message: 'Missing semicolon' },
        ],
      });

      expect(result).toBe('src/foo.ts:10:4 Unexpected token\nsrc/bar.ts:2:1 Missing semicolon');
    });
  });
});

import { globToRegexTransformer } from './glob-to-regex-transformer';

describe('globToRegexTransformer', () => {
  describe('single-segment wildcard (*)', () => {
    it("VALID: {glob: 'dist/*'} => matches a file directly in dist but not one nested deeper", () => {
      const re = globToRegexTransformer({ glob: 'dist/*' });

      expect(re.test('dist/index.js')).toBe(true);
      expect(re.test('dist/nested/index.js')).toBe(false);
    });
  });

  describe('cross-segment wildcard (**)', () => {
    it("VALID: {glob: '**/generated/**'} => matches a nested path containing a 'generated' segment", () => {
      const re = globToRegexTransformer({ glob: '**/generated/**' });

      expect(re.test('packages/web/generated/foo.ts')).toBe(true);
    });
  });

  describe('single-character wildcard (?)', () => {
    it("VALID: {glob: 'file?.ts'} => matches exactly one extra character, not zero or many", () => {
      const re = globToRegexTransformer({ glob: 'file?.ts' });

      expect(re.test('file1.ts')).toBe(true);
      expect(re.test('file.ts')).toBe(false);
      expect(re.test('file12.ts')).toBe(false);
    });
  });

  describe('literal metacharacter escaping', () => {
    it("VALID: {glob: 'src/index.ts'} => treats '.' as a literal character, not 'any character'", () => {
      const re = globToRegexTransformer({ glob: 'src/index.ts' });

      expect(re.test('src/index.ts')).toBe(true);
      expect(re.test('srcXindexXts')).toBe(false);
    });
  });
});

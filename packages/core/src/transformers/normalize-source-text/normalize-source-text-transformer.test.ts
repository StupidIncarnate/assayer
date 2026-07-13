import { normalizeSourceTextTransformer } from './normalize-source-text-transformer';

describe('normalizeSourceTextTransformer', () => {
  describe('single-line source', () => {
    it('VALID: {already single-spaced} => returned unchanged', () => {
      expect(normalizeSourceTextTransformer({ text: 'name.length === 0' })).toBe('name.length === 0');
    });
  });

  describe('reformatted source', () => {
    it('VALID: {newline + indent inside a condition} => collapses to single spaces', () => {
      expect(normalizeSourceTextTransformer({ text: 'a &&\n    b' })).toBe('a && b');
    });

    it('VALID: {leading and trailing whitespace} => trimmed', () => {
      expect(normalizeSourceTextTransformer({ text: '  x === 1  ' })).toBe('x === 1');
    });

    it('EDGE: {tabs and repeated spaces} => collapsed to single spaces', () => {
      expect(normalizeSourceTextTransformer({ text: 'x\t===   0' })).toBe('x === 0');
    });
  });
});

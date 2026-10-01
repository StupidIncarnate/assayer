
import { harnessTargetTransformer } from './harness-target-transformer';

describe('harnessTargetTransformer', () => {
  describe('pairing a harness with its source', () => {
    it('VALID: {src/audit.harness.ts beside src/audit.ts} => resolves the .ts source', () => {
      const result = harnessTargetTransformer({
        relPath: 'src/audit.harness.ts',
        sources: ['src/audit.ts', 'src/other.ts'],
      });

      expect(result).toBe('src/audit.ts');
    });

    it('VALID: {src/panel.harness.ts beside src/panel.tsx} => resolves the .tsx source', () => {
      const result = harnessTargetTransformer({
        relPath: 'src/panel.harness.ts',
        sources: ['src/panel.tsx'],
      });

      expect(result).toBe('src/panel.tsx');
    });

    it('EDGE: {both spellings present} => prefers the .ts source', () => {
      const result = harnessTargetTransformer({
        relPath: 'src/panel.harness.ts',
        sources: ['src/panel.tsx', 'src/panel.ts'],
      });

      expect(result).toBe('src/panel.ts');
    });

    it('EDGE: {neither spelling among the sources} => resolves nothing', () => {
      const result = harnessTargetTransformer({
        relPath: 'src/audit.harness.ts',
        sources: ['src/other.ts'],
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {no sources at all} => resolves nothing', () => {
      const result = harnessTargetTransformer({
        relPath: 'src/audit.harness.ts',
        sources: [],
      });

      expect(result).toBe(undefined);
    });
  });
});

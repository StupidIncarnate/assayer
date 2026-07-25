import { relPathContract } from '@assayer/shared/contracts';

import { harnessPathTransformer } from './harness-path-transformer';

describe('harnessPathTransformer', () => {
  describe('a .ts source', () => {
    it('VALID: {src/audit.ts} => src/audit.harness.ts', () => {
      expect(harnessPathTransformer({ relPath: relPathContract.parse('src/audit.ts') })).toBe('src/audit.harness.ts');
    });
  });

  describe('a .tsx source', () => {
    it('VALID: {src/panel.tsx} => src/panel.harness.ts, since a harness is always .ts', () => {
      expect(harnessPathTransformer({ relPath: relPathContract.parse('src/panel.tsx') })).toBe('src/panel.harness.ts');
    });
  });

  describe('a name carrying dots of its own', () => {
    it('EDGE: {src/audit.helper.ts} => only the trailing extension is replaced', () => {
      expect(harnessPathTransformer({ relPath: relPathContract.parse('src/audit.helper.ts') })).toBe(
        'src/audit.helper.harness.ts',
      );
    });
  });

  describe('a path with no TypeScript extension', () => {
    it('EDGE: {src/audit} => the suffix is appended, since there is no extension to replace', () => {
      expect(harnessPathTransformer({ relPath: relPathContract.parse('src/audit') })).toBe('src/audit.harness.ts');
    });
  });
});

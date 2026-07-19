import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { typescriptReadConfigAdapter } from './typescript-read-config-adapter';
import { typescriptReadConfigAdapterProxy } from './typescript-read-config-adapter.proxy';

const EMPTY_HASH = createHash('sha256').update('', 'utf8').digest('hex');

describe('typescriptReadConfigAdapter', () => {
  describe('a tsconfig is present at the search path', () => {
    it('VALID: {searchPath with a strict tsconfig} => parses the strict flag from options', () => {
      typescriptReadConfigAdapterProxy();
      const dir = mkdtempSync(join(tmpdir(), 'assayer-readconfig-'));
      writeFileSync(join(dir, 'tsconfig.json'), '{ "compilerOptions": { "strict": true, "esModuleInterop": true } }');

      const result = typescriptReadConfigAdapter({ searchPath: dir });
      rmSync(dir, { recursive: true, force: true });

      expect(result.options.strict).toBe(true);
    });

    it('VALID: {searchPath with a tsconfig} => the tsconfigHash is the sha256 of the tsconfig bytes', () => {
      typescriptReadConfigAdapterProxy();
      const dir = mkdtempSync(join(tmpdir(), 'assayer-readconfig-'));
      const tsconfig = '{ "compilerOptions": { "strict": true } }';
      writeFileSync(join(dir, 'tsconfig.json'), tsconfig);

      const result = typescriptReadConfigAdapter({ searchPath: dir });
      rmSync(dir, { recursive: true, force: true });

      expect(String(result.tsconfigHash)).toBe(createHash('sha256').update(tsconfig, 'utf8').digest('hex'));
    });
  });

  describe('no tsconfig exists above the search path', () => {
    it('EMPTY: {searchPath deep under /tmp with no tsconfig anywhere above} => empty-content hash', () => {
      typescriptReadConfigAdapterProxy();
      const dir = mkdtempSync(join(tmpdir(), 'assayer-noconfig-'));

      const result = typescriptReadConfigAdapter({ searchPath: dir });
      rmSync(dir, { recursive: true, force: true });

      expect(String(result.tsconfigHash)).toBe(EMPTY_HASH);
    });
  });
});

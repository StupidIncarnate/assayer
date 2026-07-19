import { mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SymbolNameStub } from '@assayer/shared/contracts';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { tsMorphReadExternalSignatureAdapter } from './ts-morph-read-external-signature-adapter';
import { tsMorphReadExternalSignatureAdapterProxy } from './ts-morph-read-external-signature-adapter.proxy';

const TSCONFIG = '{ "compilerOptions": { "strict": true, "moduleResolution": "node" } }';

describe('tsMorphReadExternalSignatureAdapter', () => {
  describe('a function declaration export', () => {
    it('VALID: {export declare function fnDecl(name: string, count: number): boolean} => params + return read from the declaration node', () => {
      tsMorphReadExternalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function fnDecl(name: string, count: number): boolean;\n');

      const result = tsMorphReadExternalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'fnDecl' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [
            { name: 'name', type: { kind: 'string' } },
            { name: 'count', type: { kind: 'number' } },
          ],
          returnType: { kind: 'boolean' },
        },
      });
    });
  });

  describe('a typed-const callable export', () => {
    it('VALID: {export declare const typedConst: (label: string) => number} => falls back to the first call signature', () => {
      tsMorphReadExternalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare const typedConst: (label: string) => number;\n');

      const result = tsMorphReadExternalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'typedConst' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [{ name: 'label', type: { kind: 'string' } }],
          returnType: { kind: 'number' },
        },
      });
    });
  });

  describe('a union-of-string-literals return type', () => {
    it('VALID: {export declare function statusOf(): "a" | "b"} => the return fans out per union member', () => {
      tsMorphReadExternalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function statusOf(): "a" | "b";\n');

      const result = tsMorphReadExternalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'statusOf' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [],
          returnType: {
            kind: 'union',
            members: [
              { kind: 'literal', value: 'a' },
              { kind: 'literal', value: 'b' },
            ],
          },
        },
      });
    });
  });

  describe('a generic function with no call-site binding', () => {
    it('VALID: {export declare function identity<T>(x: T): T} => the type parameter degrades to unknown', () => {
      tsMorphReadExternalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function identity<T>(x: T): T;\n');

      const result = tsMorphReadExternalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'identity' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [{ name: 'x', type: { kind: 'unknown', text: 'T' } }],
          returnType: { kind: 'unknown', text: 'T' },
        },
      });
    });
  });

  describe('an overloaded function declaration', () => {
    it('VALID: {two over(x) overloads} => the first signature is taken', () => {
      tsMorphReadExternalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(
        join(dir, 'lib.d.ts'),
        'export declare function over(x: string): number;\nexport declare function over(x: number): string;\n',
      );

      const result = tsMorphReadExternalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'over' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [{ name: 'x', type: { kind: 'string' } }],
          returnType: { kind: 'number' },
        },
      });
    });
  });

  describe('an export that names no callable', () => {
    it('EMPTY: {export declare const config: { a: number }} => ships no usable types', () => {
      tsMorphReadExternalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare const config: { a: number };\n');

      const result = tsMorphReadExternalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'config' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({ usable: false });
    });
  });
});

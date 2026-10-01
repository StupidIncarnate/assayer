import { mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { SymbolNameStub } from '@assayer/shared/contracts/symbol-name/symbol-name.stub';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { externalSignatureReadDeclarationBroker } from './external-signature-read-declaration-broker';
import { externalSignatureReadDeclarationBrokerProxy } from './external-signature-read-declaration-broker.proxy';

const TSCONFIG = '{ "compilerOptions": { "strict": true, "moduleResolution": "node" } }';

describe('externalSignatureReadDeclarationBroker', () => {
  describe('a function declaration export', () => {
    it('VALID: {export declare function fnDecl(name: string, count: number): boolean} => params + return read from the declaration node', () => {
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function fnDecl(name: string, count: number): boolean;\n');

      const result = externalSignatureReadDeclarationBroker({
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
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare const typedConst: (label: string) => number;\n');

      const result = externalSignatureReadDeclarationBroker({
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
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function statusOf(): "a" | "b";\n');

      const result = externalSignatureReadDeclarationBroker({
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
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function identity<T>(x: T): T;\n');

      const result = externalSignatureReadDeclarationBroker({
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
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(
        join(dir, 'lib.d.ts'),
        'export declare function over(x: string): number;\nexport declare function over(x: number): string;\n',
      );

      const result = externalSignatureReadDeclarationBroker({
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

  describe('a tuple parameter', () => {
    // Before this branch existed, a `readonly [string, number]` parameter read as an anonymous object
    // enumerating `0`, `1`, `length` and every inherited `ReadonlyArray` method — a multi-thousand-
    // character dump in both this result and the P1 message built from it.
    it('VALID: {export declare function pairOf(pair: readonly [string, number]): void} => a tuple descriptor, not the ReadonlyArray dump', () => {
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare function pairOf(pair: readonly [string, number]): void;\n');

      const result = externalSignatureReadDeclarationBroker({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'pairOf' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [{ name: 'pair', type: { kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] } }],
          returnType: { kind: 'unknown', text: 'void' },
        },
      });
    });
  });

  describe('a template literal parameter and return, on both callable shapes', () => {
    it(`VALID: {export declare function idOf(t: \`id-\${string}\`): \`out-\${number}\`} => a template descriptor for the param AND the return`, () => {
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), `export declare function idOf(t: \`id-\${string}\`): \`out-\${number}\`;\n`);

      const result = externalSignatureReadDeclarationBroker({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'idOf' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [{ name: 't', type: { kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] } }],
          returnType: { kind: 'template', texts: ['out-', ''], types: [{ kind: 'number' }] },
        },
      });
    });

    // The typed-const branch reads its type node off the SIGNATURE's own declaration
    // (`signature.getDeclaration()`), never off the exported declaration passed in, so this proves that
    // second thread independently of the function-declaration branch above.
    it(`VALID: {export declare const idConst: (t: \`id-\${string}\`) => \`out-\${number}\`} => the same template descriptors, off the call-signature branch`, () => {
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), `export declare const idConst: (t: \`id-\${string}\`) => \`out-\${number}\`;\n`);

      const result = externalSignatureReadDeclarationBroker({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'idConst' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [{ name: 't', type: { kind: 'template', texts: ['id-', ''], types: [{ kind: 'string' }] } }],
          returnType: { kind: 'template', texts: ['out-', ''], types: [{ kind: 'number' }] },
        },
      });
    });
  });

  describe('an intersection parameter', () => {
    it('VALID: {export declare function combine(v: Ay & Bee): string} => an object descriptor merging both shapes', () => {
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(
        join(dir, 'lib.d.ts'),
        'export interface Ay { a: string }\nexport interface Bee { b: number }\nexport declare function combine(v: Ay & Bee): string;\n',
      );

      const result = externalSignatureReadDeclarationBroker({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'combine' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        signature: {
          params: [
            {
              name: 'v',
              type: {
                kind: 'object',
                properties: [
                  { name: 'a', type: { kind: 'string' } },
                  { name: 'b', type: { kind: 'number' } },
                ],
              },
            },
          ],
          returnType: { kind: 'string' },
        },
      });
    });
  });

  describe('an export that names no callable', () => {
    it('EMPTY: {export declare const config: { a: number }} => ships no usable types', () => {
      externalSignatureReadDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-extsig-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(dir, 'lib.d.ts'), 'export declare const config: { a: number };\n');

      const result = externalSignatureReadDeclarationBroker({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        dtsPath: FilePathStub({ value: join(dir, 'lib.d.ts') }),
        exportName: SymbolNameStub({ value: 'config' }),
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({ usable: false });
    });
  });
});

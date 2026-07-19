import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ModuleSpecifierStub, SymbolNameStub } from '@assayer/shared/contracts';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { tsMorphReadGlobalSignatureAdapter } from './ts-morph-read-global-signature-adapter';
import { tsMorphReadGlobalSignatureAdapterProxy } from './ts-morph-read-global-signature-adapter.proxy';

const TSCONFIG = '{ "compilerOptions": { "strict": true, "moduleResolution": "node" } }';
const NODE_TYPES =
  'interface ProcessEnv { [key: string]: string | undefined; }\n' +
  'declare var process: { env: ProcessEnv; cwd(): string };\n' +
  "declare module 'node:path' {\n  export function join(...paths: string[]): string;\n  export const sep: string;\n}\n";

describe('tsMorphReadGlobalSignatureAdapter', () => {
  describe('a called global method', () => {
    it('VALID: {process.cwd()} => its declared signature, keyed to the resolving .d.ts', () => {
      tsMorphReadGlobalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      mkdirSync(join(dir, 'node_modules', '@types', 'node'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = tsMorphReadGlobalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'signature',
        signature: { params: [], returnType: { kind: 'string' } },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a global member access', () => {
    it('VALID: {process.env} => the member type, keyed to the resolving .d.ts', () => {
      tsMorphReadGlobalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      mkdirSync(join(dir, 'node_modules', '@types', 'node'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = tsMorphReadGlobalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'env' }), called: false },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'type',
        type: { kind: 'unknown', text: 'ProcessEnv' },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a called node builtin import', () => {
    it('VALID: {join from node:path} => its declared signature, keyed to the resolving .d.ts', () => {
      tsMorphReadGlobalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      mkdirSync(join(dir, 'node_modules', '@types', 'node'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = tsMorphReadGlobalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        reference: { kind: 'builtin', specifier: ModuleSpecifierStub({ value: 'node:path' }), importedName: SymbolNameStub({ value: 'join' }), called: true },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'signature',
        signature: { params: [{ name: 'paths', type: { kind: 'unknown', text: 'string[]' } }], returnType: { kind: 'string' } },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a node builtin bound as a VALUE', () => {
    it('VALID: {sep from node:path, not called} => its declared type, keyed to the resolving .d.ts', () => {
      tsMorphReadGlobalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      mkdirSync(join(dir, 'node_modules', '@types', 'node'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = tsMorphReadGlobalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        reference: { kind: 'builtin', specifier: ModuleSpecifierStub({ value: 'node:path' }), importedName: SymbolNameStub({ value: 'sep' }), called: false },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'type',
        type: { kind: 'string' },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a name @types/node cannot type', () => {
    it('EMPTY: {an undeclared global method} => ships no usable types', () => {
      tsMorphReadGlobalSignatureAdapterProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      mkdirSync(join(dir, 'node_modules', '@types', 'node'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = tsMorphReadGlobalSignatureAdapter({
        tsConfigFilePath: FilePathStub({ value: join(dir, 'tsconfig.json') }),
        reference: { kind: 'global', name: SymbolNameStub({ value: 'zzzNoSuchGlobal' }), member: SymbolNameStub({ value: 'foo' }), called: true },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({ usable: false });
    });
  });
});

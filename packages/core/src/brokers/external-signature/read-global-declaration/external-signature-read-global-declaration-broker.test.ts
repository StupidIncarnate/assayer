import { ensureDirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { externalSignatureReadGlobalDeclarationBroker } from './external-signature-read-global-declaration-broker';
import { externalSignatureReadGlobalDeclarationBrokerProxy } from './external-signature-read-global-declaration-broker.proxy';

const TSCONFIG = '{ "compilerOptions": { "strict": true, "moduleResolution": "node" } }';
const NODE_TYPES =
  'interface ProcessEnv { [key: string]: string | undefined; }\n' +
  `declare var process: { env: ProcessEnv; cwd(): string; hrtime(): readonly [number, number]; release: \`v\${number}\` };\n` +
  "declare module 'node:path' {\n  export function join(...paths: string[]): string;\n  export const sep: string;\n}\n";

const DESTRUCTURED_TYPES = 'declare function pick({ a }: { a: string }, rest: number): string;\n';

describe('externalSignatureReadGlobalDeclarationBroker', () => {
  describe('a called global method', () => {
    it('VALID: {process.cwd()} => its declared signature, keyed to the resolving .d.ts', () => {
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'process', member: 'cwd', called: true },
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
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'process', member: 'env', called: false },
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

  describe('a called global method with a tuple return', () => {
    // Before the tuple branch existed, `readonly [number, number]` read as an anonymous object
    // enumerating `0`, `1`, `length` and every inherited `ReadonlyArray` method.
    it('VALID: {process.hrtime()} => a tuple descriptor, not the ReadonlyArray dump', () => {
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'process', member: 'hrtime', called: true },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'signature',
        signature: {
          params: [],
          returnType: { kind: 'tuple', elements: [{ kind: 'number' }, { kind: 'number' }] },
        },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a global member access with a template literal type', () => {
    it('VALID: {process.release} => a template descriptor, off the member access branch', () => {
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'process', member: 'release', called: false },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'type',
        type: { kind: 'template', texts: ['v', ''], types: [{ kind: 'number' }] },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a called node builtin import', () => {
    it('VALID: {join from node:path} => its declared signature, keyed to the resolving .d.ts', () => {
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'builtin', specifier: 'node:path', importedName: 'join', called: true },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({
        usable: true,
        result: 'signature',
        signature: {
          params: [{ name: 'paths', type: { kind: 'array', element: { kind: 'string' } } }],
          returnType: { kind: 'string' },
        },
        declText: NODE_TYPES,
      });
    });
  });

  describe('a node builtin bound as a VALUE', () => {
    it('VALID: {sep from node:path, not called} => its declared type, keyed to the resolving .d.ts', () => {
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'builtin', specifier: 'node:path', importedName: 'sep', called: false },
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
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(dir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(dir, 'node_modules', '@types', 'node'));
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES);

      const result = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(dir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'zzzNoSuchGlobal', member: 'foo', called: true },
      });
      rmSync(dir, { recursive: true, force: true });

      expect(result).toStrictEqual({ usable: false });
    });
  });

  describe('reading one declaration twice in one process', () => {
    it('VALID: {a called global with a destructured parameter, read from two projects} => gives identical parameter names both times', () => {
      externalSignatureReadGlobalDeclarationBrokerProxy();
      const firstDir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      const secondDir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-global-')));
      writeFileSync(join(firstDir, 'tsconfig.json'), TSCONFIG);
      writeFileSync(join(secondDir, 'tsconfig.json'), TSCONFIG);
      ensureDirSync(join(firstDir, 'node_modules', '@types', 'node'));
      ensureDirSync(join(secondDir, 'node_modules', '@types', 'node'));
      writeFileSync(join(firstDir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(secondDir, 'node_modules', '@types', 'node', 'package.json'), '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }');
      writeFileSync(join(firstDir, 'node_modules', '@types', 'node', 'index.d.ts'), DESTRUCTURED_TYPES);
      writeFileSync(join(secondDir, 'node_modules', '@types', 'node', 'index.d.ts'), DESTRUCTURED_TYPES);

      const first = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(firstDir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'pick', called: true },
      });
      const second = externalSignatureReadGlobalDeclarationBroker({
        tsConfigFilePath: join(secondDir, 'tsconfig.json'),
        reference: { kind: 'global', name: 'pick', called: true },
      });
      rmSync(firstDir, { recursive: true, force: true });
      rmSync(secondDir, { recursive: true, force: true });

      expect({ first, second }).toStrictEqual({
        first: {
          usable: true,
          result: 'signature',
          signature: {
            params: [
              { name: '__0', type: { kind: 'unknown', text: '{ a: string; }' } },
              { name: 'rest', type: { kind: 'number' } },
            ],
            returnType: { kind: 'string' },
          },
          declText: DESTRUCTURED_TYPES,
        },
        second: {
          usable: true,
          result: 'signature',
          signature: {
            params: [
              { name: '__0', type: { kind: 'unknown', text: '{ a: string; }' } },
              { name: 'rest', type: { kind: 'number' } },
            ],
            returnType: { kind: 'string' },
          },
          declText: DESTRUCTURED_TYPES,
        },
      });
    });
  });
});

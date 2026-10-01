import { ExternalSignatureStub } from '@assayer/shared/contracts/external-signature/external-signature.stub';
import { ModuleSpecifierStub } from '@assayer/shared/contracts/module-specifier/module-specifier.stub';
import { SymbolNameStub } from '@assayer/shared/contracts/symbol-name/symbol-name.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { externalSignatureReadGlobalBroker } from './external-signature-read-global-broker';
import { externalSignatureReadGlobalBrokerProxy } from './external-signature-read-global-broker.proxy';

const DECL_TEXT = 'declare var process: { env: { [k: string]: string }; cwd(): string };\n';
const CACHE_DIR = '/repo/.assayer/cache';

describe('externalSignatureReadGlobalBroker', () => {
  describe('a called global method not yet cached', () => {
    it('VALID: {cache miss} => reads the signature via ts-morph and writes it to the cache once', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const signature = ExternalSignatureStub({ params: [], returnType: { kind: 'string' } });
      const tsConfigFilePath = FilePathStub({ value: '/repo/tsconfig.json' });
      proxy.cacheMiss({
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        declText: DECL_TEXT,
        cacheDir: CACHE_DIR,
      });
      proxy.readsSignature({
        tsConfigFilePath,
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        signature,
        declText: DECL_TEXT,
      });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath,
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        cacheDir: CACHE_DIR,
      });

      expect(result).toStrictEqual({ usable: true, result: 'signature', signature });
      expect(proxy.wasWritten()).toBe(true);
      expect(proxy.getWrittenPayload()).toStrictEqual({ result: 'signature', signature });
    });
  });

  describe('a member access type not yet cached', () => {
    it('VALID: {cache miss} => reads the member type and writes it to the cache once', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'ProcessEnv' });
      const tsConfigFilePath = FilePathStub({ value: '/repo/tsconfig.json' });
      proxy.cacheMiss({
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'env' }), called: false },
        declText: DECL_TEXT,
        cacheDir: CACHE_DIR,
      });
      proxy.readsType({
        tsConfigFilePath,
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'env' }), called: false },
        type,
        declText: DECL_TEXT,
      });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath,
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'env' }), called: false },
        cacheDir: CACHE_DIR,
      });

      expect(result).toStrictEqual({ usable: true, result: 'type', type });
      expect(proxy.getWrittenPayload()).toStrictEqual({ result: 'type', type });
    });
  });

  describe('a global already cached for the same .d.ts bytes', () => {
    it('VALID: {cache hit} => returns the signature and writes nothing further', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const signature = ExternalSignatureStub({ params: [], returnType: { kind: 'string' } });
      const tsConfigFilePath = FilePathStub({ value: '/repo/tsconfig.json' });
      proxy.cacheHit({
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        declText: DECL_TEXT,
        cacheDir: CACHE_DIR,
      });
      proxy.readsSignature({
        tsConfigFilePath,
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        signature,
        declText: DECL_TEXT,
      });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath,
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        cacheDir: CACHE_DIR,
      });

      expect(result).toStrictEqual({ usable: true, result: 'signature', signature });
      expect(proxy.wasWritten()).toBe(false);
    });
  });

  describe('a reference @types/node cannot type', () => {
    it('EMPTY: {ts-morph reports no usable types} => returns usable: false and writes nothing', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const tsConfigFilePath = FilePathStub({ value: '/repo/tsconfig.json' });
      proxy.readsNoUsableTypes({
        tsConfigFilePath,
        reference: { kind: 'builtin', specifier: ModuleSpecifierStub({ value: 'node:unknownmod' }), importedName: SymbolNameStub({ value: 'x' }), called: true },
      });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath,
        reference: { kind: 'builtin', specifier: ModuleSpecifierStub({ value: 'node:unknownmod' }), importedName: SymbolNameStub({ value: 'x' }), called: true },
        cacheDir: CACHE_DIR,
      });

      expect(result).toStrictEqual({ usable: false });
      expect(proxy.wasWritten()).toBe(false);
    });
  });
});

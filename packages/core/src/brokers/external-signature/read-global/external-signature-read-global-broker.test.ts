import { ExternalSignatureStub, ModuleSpecifierStub, SymbolNameStub, TypeDescriptorStub } from '@assayer/shared/contracts';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { externalSignatureReadGlobalBroker } from './external-signature-read-global-broker';
import { externalSignatureReadGlobalBrokerProxy } from './external-signature-read-global-broker.proxy';

const DECL_TEXT = 'declare var process: { env: { [k: string]: string }; cwd(): string };\n';

describe('externalSignatureReadGlobalBroker', () => {
  describe('a called global method not yet cached', () => {
    it('VALID: {cache miss} => reads the signature via ts-morph and writes it to the cache once', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const signature = ExternalSignatureStub({ params: [], returnType: { kind: 'string' } });
      proxy.cacheMiss();
      proxy.readsSignature({ signature, declText: DECL_TEXT });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath: FilePathStub({ value: '/repo/tsconfig.json' }),
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: true, result: 'signature', signature });
      expect(proxy.wasWritten()).toBe(true);
      expect(proxy.getWrittenContent()).toStrictEqual({ result: 'signature', signature });
    });
  });

  describe('a member access type not yet cached', () => {
    it('VALID: {cache miss} => reads the member type and writes it to the cache once', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const type = TypeDescriptorStub({ kind: 'unknown', text: 'ProcessEnv' });
      proxy.cacheMiss();
      proxy.readsType({ type, declText: DECL_TEXT });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath: FilePathStub({ value: '/repo/tsconfig.json' }),
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'env' }), called: false },
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: true, result: 'type', type });
      expect(proxy.getWrittenContent()).toStrictEqual({ result: 'type', type });
    });
  });

  describe('a global already cached for the same .d.ts bytes', () => {
    it('VALID: {cache hit} => returns the signature and writes nothing further', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      const signature = ExternalSignatureStub({ params: [], returnType: { kind: 'string' } });
      proxy.cacheHit();
      proxy.readsSignature({ signature, declText: DECL_TEXT });

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath: FilePathStub({ value: '/repo/tsconfig.json' }),
        reference: { kind: 'global', name: SymbolNameStub({ value: 'process' }), member: SymbolNameStub({ value: 'cwd' }), called: true },
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: true, result: 'signature', signature });
      expect(proxy.wasWritten()).toBe(false);
    });
  });

  describe('a reference @types/node cannot type', () => {
    it('EMPTY: {ts-morph reports no usable types} => returns usable: false and writes nothing', async () => {
      const proxy = externalSignatureReadGlobalBrokerProxy();
      proxy.cacheMiss();
      proxy.readsNoUsableTypes();

      const result = await externalSignatureReadGlobalBroker({
        tsConfigFilePath: FilePathStub({ value: '/repo/tsconfig.json' }),
        reference: { kind: 'builtin', specifier: ModuleSpecifierStub({ value: 'node:unknownmod' }), importedName: SymbolNameStub({ value: 'x' }), called: true },
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: false });
      expect(proxy.wasWritten()).toBe(false);
    });
  });
});

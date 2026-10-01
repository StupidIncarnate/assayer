import { ExternalSignatureStub } from '@assayer/shared/contracts/external-signature/external-signature.stub';

import { externalSignatureReadBroker } from './external-signature-read-broker';
import { externalSignatureReadBrokerProxy } from './external-signature-read-broker.proxy';

const DTS = 'export declare const greet: () => string;\n';

describe('externalSignatureReadBroker', () => {
  describe('a signature not yet cached', () => {
    it('VALID: {cache miss} => reads the signature via ts-morph and writes it to the cache once', async () => {
      const proxy = externalSignatureReadBrokerProxy();
      const signature = ExternalSignatureStub({ params: [], returnType: { kind: 'string' } });
      proxy.cacheMiss({
        dtsPath: '/repo/node_modules/pkg/index.d.ts',
        dtsContent: DTS,
        exportName: 'greet',
        cacheDir: '/repo/.assayer/cache',
      });
      proxy.readsSignature({ exportName: 'greet', signature });

      const result = await externalSignatureReadBroker({
        tsConfigFilePath: '/repo/tsconfig.json',
        dtsPath: '/repo/node_modules/pkg/index.d.ts',
        exportName: 'greet',
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: true, signature });
      expect(proxy.wasWritten()).toBe(true);
      expect(proxy.getWrittenSignature()).toStrictEqual(signature);
    });
  });

  describe('a signature already cached for the same .d.ts bytes', () => {
    it('VALID: {cache hit} => returns the cached signature without re-reading ts-morph', async () => {
      const proxy = externalSignatureReadBrokerProxy();
      const signature = ExternalSignatureStub({ params: [], returnType: { kind: 'string' } });
      proxy.cacheHit({
        dtsPath: '/repo/node_modules/pkg/index.d.ts',
        dtsContent: DTS,
        exportName: 'greet',
        cacheDir: '/repo/.assayer/cache',
        signatureJson: JSON.stringify(signature),
      });

      const result = await externalSignatureReadBroker({
        tsConfigFilePath: '/repo/tsconfig.json',
        dtsPath: '/repo/node_modules/pkg/index.d.ts',
        exportName: 'greet',
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: true, signature });
      expect(proxy.signatureReadCount()).toBe(0);
    });
  });

  describe('a resolved export that names no callable', () => {
    it('EMPTY: {ts-morph reports no usable types} => returns usable: false and writes nothing', async () => {
      const proxy = externalSignatureReadBrokerProxy();
      proxy.cacheMiss({
        dtsPath: '/repo/node_modules/pkg/index.d.ts',
        dtsContent: 'export declare const config: { a: number };\n',
        exportName: 'config',
        cacheDir: '/repo/.assayer/cache',
      });
      proxy.readsNoUsableTypes({ exportName: 'config' });

      const result = await externalSignatureReadBroker({
        tsConfigFilePath: '/repo/tsconfig.json',
        dtsPath: '/repo/node_modules/pkg/index.d.ts',
        exportName: 'config',
        cacheDir: '/repo/.assayer/cache',
      });

      expect(result).toStrictEqual({ usable: false });
      expect(proxy.wasWritten()).toBe(false);
    });
  });
});

import { manifestLoadBroker } from './manifest-load-broker';
import { manifestLoadBrokerProxy } from './manifest-load-broker.proxy';
import { AssayerCacheManifestStub } from '@assayer/shared/contracts';

describe('manifestLoadBroker', () => {
  describe('manifest present and matching', () => {
    it('VALID: {configDir: manifest.json present, matches expected version and hash} => returns status ok with the parsed manifest', async () => {
      const proxy = manifestLoadBrokerProxy();
      const manifest = AssayerCacheManifestStub();
      proxy.present({ manifestJson: JSON.stringify(manifest) });

      const result = await manifestLoadBroker({
        configDir: '/repo',
        expectedAssayerVersion: manifest.assayerVersion,
        expectedConfigHash: manifest.configHash,
      });

      expect(result).toStrictEqual({ status: 'ok', manifest });
    });
  });

  describe('manifest missing', () => {
    it('EMPTY: {configDir: no manifest.json on disk} => returns status missing', async () => {
      const proxy = manifestLoadBrokerProxy();
      proxy.absent();

      const result = await manifestLoadBroker({
        configDir: '/repo',
        expectedAssayerVersion: '1.0.0',
        expectedConfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      expect(result).toStrictEqual({ status: 'missing' });
    });
  });

  describe('manifest malformed', () => {
    it('ERROR: {configDir: manifest.json contains malformed JSON} => returns status invalid with the parser reason', async () => {
      const proxy = manifestLoadBrokerProxy();
      proxy.malformed();

      const result = await manifestLoadBroker({
        configDir: '/repo',
        expectedAssayerVersion: '1.0.0',
        expectedConfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      expect(result).toStrictEqual({
        status: 'invalid',
        reason: "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
      });
    });
  });

  describe('manifest fails schema validation', () => {
    it('ERROR: {configDir: manifest.json is valid JSON but does not match the manifest schema} => returns status invalid with a schema validation reason', async () => {
      const proxy = manifestLoadBrokerProxy();
      proxy.present({ manifestJson: '{}' });

      const result = await manifestLoadBroker({
        configDir: '/repo',
        expectedAssayerVersion: '1.0.0',
        expectedConfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      expect(result).toStrictEqual({
        status: 'invalid',
        reason: 'manifest failed schema validation',
      });
    });
  });

  describe('manifest configHash mismatch', () => {
    it('EDGE: {configDir: manifest.json structurally valid but configHash differs from expected} => returns status invalid', async () => {
      const proxy = manifestLoadBrokerProxy();
      const manifest = AssayerCacheManifestStub();
      proxy.present({ manifestJson: JSON.stringify(manifest) });

      const result = await manifestLoadBroker({
        configDir: '/repo',
        expectedAssayerVersion: manifest.assayerVersion,
        expectedConfigHash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      });

      expect(result).toStrictEqual({
        status: 'invalid',
        reason: 'manifest configHash or assayerVersion mismatch',
      });
    });
  });
});

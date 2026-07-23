import { stubOverlayLoadBroker } from './stub-overlay-load-broker';
import { stubOverlayLoadBrokerProxy } from './stub-overlay-load-broker.proxy';

describe('stubOverlayLoadBroker', () => {
  describe('an objects overlay and an env overlay committed under the root', () => {
    it('VALID: {objects/foo.ts/Config.json + env/MODE.json} => one object correction keyed foo.ts#Config and one env correction keyed process.env#MODE', async () => {
      const proxy = stubOverlayLoadBrokerProxy();
      // objects walk: objects root -> a definition dir -> the type file
      proxy.queueDir({ entries: [{ name: 'foo.ts', isDirectory: true }] });
      proxy.queueDir({ entries: [{ name: 'Config.json', isDirectory: false }] });
      // env walk: env root -> the property file
      proxy.queueDir({ entries: [{ name: 'MODE.json', isDirectory: false }] });
      proxy.queueFileContent({ content: '{"type":"foo.ts#Config","properties":{"mode":{"values":["dev","prod"]}}}' });
      proxy.queueFileContent({ content: '{"source":"process.env","property":"MODE","values":["production"]}' });

      const result = await stubOverlayLoadBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual([
        {
          kind: 'object',
          key: 'foo.ts#Config',
          overlayPath: 'assayer/stubs/objects/foo.ts/Config.json',
          properties: [{ name: 'mode', values: ['dev', 'prod'] }],
        },
        {
          kind: 'env',
          key: 'process.env#MODE',
          overlayPath: 'assayer/stubs/env/MODE.json',
          property: 'MODE',
          values: ['production'],
        },
      ]);
    });
  });

  describe('neither overlay directory exists', () => {
    it('EMPTY: {no objects dir and no env dir} => returns an empty overlay without error', async () => {
      const proxy = stubOverlayLoadBrokerProxy();
      proxy.dirMissing();
      proxy.dirMissing();

      const result = await stubOverlayLoadBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('the objects overlay declares two properties out of alphabetical order', () => {
    it('VALID: {objects/foo.ts/Config.json naming region then mode} => properties sorted by name, values preserved', async () => {
      const proxy = stubOverlayLoadBrokerProxy();
      proxy.dirExists();
      proxy.dirMissing();
      proxy.queueDir({ entries: [{ name: 'foo.ts', isDirectory: true }] });
      proxy.queueDir({ entries: [{ name: 'Config.json', isDirectory: false }] });
      proxy.queueFileContent({
        content: '{"type":"foo.ts#Config","properties":{"region":{"values":["us"]},"mode":{"values":["dev"]}}}',
      });

      const result = await stubOverlayLoadBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual([
        {
          kind: 'object',
          key: 'foo.ts#Config',
          overlayPath: 'assayer/stubs/objects/foo.ts/Config.json',
          properties: [
            { name: 'mode', values: ['dev'] },
            { name: 'region', values: ['us'] },
          ],
        },
      ]);
    });
  });
});

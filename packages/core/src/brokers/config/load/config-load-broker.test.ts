import { configLoadBroker } from './config-load-broker';
import { configLoadBrokerProxy } from './config-load-broker.proxy';

describe('configLoadBroker', () => {
  describe('valid config file', () => {
    it('VALID: {configPath: file with valid config JSON} => returns the parsed config', async () => {
      const proxy = configLoadBrokerProxy();
      proxy.hasContent({ content: '{"version":"1","repoRoot":".","exclude":[]}' });

      const result = await configLoadBroker({ configPath: '/repo/assayer.config.json' });

      expect(result).toStrictEqual({
        success: true,
        data: { version: '1', repoRoot: '.', exclude: [] },
      });
    });
  });

  describe('malformed JSON', () => {
    it('ERROR: {configPath: file with a trailing comma} => returns success:false with the position from the parser message', async () => {
      const proxy = configLoadBrokerProxy();
      proxy.hasContent({ content: '{"version": "1",}' });

      const result = await configLoadBroker({ configPath: '/repo/assayer.config.json' });

      expect(result).toStrictEqual({
        success: false,
        message: 'Expected double-quoted property name in JSON at position 16 (line 1 column 17)',
        line: 1,
        column: 17,
      });
    });

    it('ERROR: {configPath: file with a missing property value} => returns success:false, falling back to line 1 column 1 when the parser message has no position', async () => {
      const proxy = configLoadBrokerProxy();
      proxy.hasContent({ content: '{"version": }' });

      const result = await configLoadBroker({ configPath: '/repo/assayer.config.json' });

      expect(result).toStrictEqual({
        success: false,
        message: 'Unexpected token \'}\', "{"version": }" is not valid JSON',
        line: 1,
        column: 1,
      });
    });
  });

  describe('valid JSON that fails schema validation', () => {
    it('ERROR: {configPath: file with an invalid version literal} => rejects with the underlying validation error instead of a parse failure', async () => {
      const proxy = configLoadBrokerProxy();
      proxy.hasContent({ content: '{"version":"2","repoRoot":".","exclude":[]}' });

      await expect(configLoadBroker({ configPath: '/repo/assayer.config.json' })).rejects.toThrow(
        /Invalid literal value/u
      );
    });
  });
});

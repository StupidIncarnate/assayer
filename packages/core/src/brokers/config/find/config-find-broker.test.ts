import { configFindBroker } from './config-find-broker';
import { configFindBrokerProxy } from './config-find-broker.proxy';

describe('configFindBroker', () => {
  describe('config found in an ancestor directory', () => {
    it('VALID: {startDir: "/a/b/c/d"} => finds assayer.config.json 3 levels up at "/a"', async () => {
      const proxy = configFindBrokerProxy();

      proxy.configLivesIn({ levelsBelow: 3 });

      const result = await configFindBroker({ startDir: '/a/b/c/d' });

      expect(result).toStrictEqual({
        found: true,
        configDir: '/a',
        configPath: '/a/assayer.config.json',
      });
    });
  });

  describe('config missing all the way to the filesystem root', () => {
    it('EMPTY: {startDir: "/a/b/c/d"} => returns { found: false } when no assayer.config.json exists up to the filesystem root', async () => {
      const proxy = configFindBrokerProxy();

      proxy.neverFound();

      const result = await configFindBroker({ startDir: '/a/b/c/d' });

      expect(result).toStrictEqual({ found: false });
    });
  });
});

import { packageJsonReadBroker } from './package-json-read-broker';
import { packageJsonReadBrokerProxy } from './package-json-read-broker.proxy';

describe('packageJsonReadBroker', () => {
  describe('valid package.json', () => {
    it('VALID: {cli package.json} => returns the current assayer version', async () => {
      const proxy = packageJsonReadBrokerProxy();
      proxy.packageJsonHasVersion({ version: '1.0.0' });

      await expect(packageJsonReadBroker()).resolves.toBe('1.0.0');
    });
  });
});

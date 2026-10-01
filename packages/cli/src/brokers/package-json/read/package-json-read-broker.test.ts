import { packageJsonReadBroker } from './package-json-read-broker';
import { packageJsonReadBrokerProxy } from './package-json-read-broker.proxy';

describe('packageJsonReadBroker', () => {
  describe('valid package.json', () => {
    it('VALID: {cli package.json} => returns the current assayer version', async () => {
      packageJsonReadBrokerProxy();

      await expect(packageJsonReadBroker()).resolves.toBe('1.0.0');
    });
  });
});

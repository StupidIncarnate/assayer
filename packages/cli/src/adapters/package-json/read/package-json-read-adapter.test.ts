import { packageJsonReadAdapter } from './package-json-read-adapter';
import { packageJsonReadAdapterProxy } from './package-json-read-adapter.proxy';

describe('packageJsonReadAdapter', () => {
  describe('valid package.json', () => {
    it('VALID: {cli package.json} => returns the current assayer version', async () => {
      packageJsonReadAdapterProxy();

      await expect(packageJsonReadAdapter()).resolves.toBe('1.0.0');
    });
  });
});

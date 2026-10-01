import { VersionShowResponder } from './version-show-responder';
import { VersionShowResponderProxy } from './version-show-responder.proxy';

describe('VersionShowResponder', () => {
  describe('package version', () => {
    it('VALID: {} => returns exactly \'assayer 1.0.0\' as CliOutput', async () => {
      const proxy = VersionShowResponderProxy();
      proxy.packageJsonHasVersion({ version: '1.0.0' });

      await expect(VersionShowResponder()).resolves.toBe('assayer 1.0.0');
    });
  });
});

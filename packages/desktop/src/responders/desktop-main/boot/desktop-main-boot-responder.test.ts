import { DesktopMainBootResponder } from './desktop-main-boot-responder';
import { DesktopMainBootResponderProxy } from './desktop-main-boot-responder.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('DesktopMainBootResponder', () => {
  describe('booting the main process', () => {
    it('VALID: {repoPath} => boots the window and returns success', async () => {
      DesktopMainBootResponderProxy();

      const result = await DesktopMainBootResponder({ repoPath: RepoPathStub({ value: '/tmp/target' }) });

      expect(result).toStrictEqual({ success: true });
    });
  });
});

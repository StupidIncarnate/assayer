import { DesktopMainBootResponder } from './desktop-main-boot-responder';
import { DesktopMainBootResponderProxy } from './desktop-main-boot-responder.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

describe('DesktopMainBootResponder', () => {
  describe('booting the main process', () => {
    it('VALID: {repoPath} => boots the window, registers all IPC channels, and returns success', async () => {
      const proxy = DesktopMainBootResponderProxy();

      const result = await DesktopMainBootResponder({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.handledChannels()).toStrictEqual([
        desktopBridgeStatics.channels.status,
        desktopBridgeStatics.channels.compiledTree,
        desktopBridgeStatics.channels.compiledFile,
        desktopBridgeStatics.channels.run,
        desktopBridgeStatics.channels.savedRun,
      ]);
    });
  });

  describe('compiled-file IPC validation', () => {
    it('INVALID: {relPath: 42} => rejects before reaching the compiled-file broker', async () => {
      const proxy = DesktopMainBootResponderProxy();
      await DesktopMainBootResponder({ repoPath: RepoPathStub({ value: '/repo' }) });

      await expect(proxy.invokeCompiledFileHandler({ relPath: 42 })).rejects.toThrow(
        /Expected string, received number/u,
      );
    });
  });
});

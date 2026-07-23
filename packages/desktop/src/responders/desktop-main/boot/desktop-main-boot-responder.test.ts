import { DesktopMainBootResponder } from './desktop-main-boot-responder';
import { DesktopMainBootResponderProxy } from './desktop-main-boot-responder.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

// Zod's own rendering of a relPath that is not a string, asserted whole because it is what the UI
// shows. It reaches the renderer as DATA: a handler that THREW would have had Electron build
// `Error invoking remote method 'assayer:compiled-file': Error: ` in front of it on the way out.
const RELPATH_NOT_A_STRING_MESSAGE = [
  '[',
  '  {',
  '    "code": "invalid_type",',
  '    "expected": "string",',
  '    "received": "number",',
  '    "path": [],',
  '    "message": "Expected string, received number"',
  '  }',
  ']',
].join('\n');

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
        desktopBridgeStatics.channels.stubs,
        desktopBridgeStatics.channels.run,
        desktopBridgeStatics.channels.savedRun,
      ]);
    });
  });

  describe('compiled-file IPC validation', () => {
    // The broker is bare-invoked in the proxy, so had validation not caught this the handler would
    // have answered a success instead — the failure reply is the proof it never got that far.
    it('INVALID: {relPath: 42} => answers with the validation failure, never reaching the compiled-file broker', async () => {
      const proxy = DesktopMainBootResponderProxy();
      await DesktopMainBootResponder({ repoPath: RepoPathStub({ value: '/repo' }) });

      const result = await proxy.invokeCompiledFileHandler({ relPath: 42 });

      expect(result).toStrictEqual({ success: false, message: RELPATH_NOT_A_STRING_MESSAGE });
    });
  });
});

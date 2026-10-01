import { DesktopMainBootResponder } from './desktop-main-boot-responder';
import { DesktopMainBootResponderProxy } from './desktop-main-boot-responder.proxy';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

// Zod's own rendering of a relPath that is not a string, asserted whole because it is what the UI
// shows. It reaches the renderer as DATA: a handler that THREW would have had Electron build
// `Error invoking remote method 'assayer:compiled-file': Error: ` in front of it on the way out.
const RELPATH_NOT_A_STRING_MESSAGE = [
  '[',
  '  {',
  '    "expected": "string",',
  '    "code": "invalid_type",',
  '    "path": [],',
  '    "message": "Invalid input: expected string, received number"',
  '  }',
  ']',
].join('\n');

describe('DesktopMainBootResponder', () => {
  describe('booting the main process', () => {
    it('VALID: {repoPath} => boots the window and registers all IPC channels', async () => {
      const proxy = DesktopMainBootResponderProxy();
      proxy.setupBoot();

      await DesktopMainBootResponder({ repoPath: '/repo' });

      expect(proxy.handledChannels()).toStrictEqual([
        desktopBridgeStatics.channels.status,
        desktopBridgeStatics.channels.compiledTree,
        desktopBridgeStatics.channels.compiledFile,
        desktopBridgeStatics.channels.stubs,
        desktopBridgeStatics.channels.run,
        desktopBridgeStatics.channels.savedRun,
        desktopBridgeStatics.channels.savedConsole,
      ]);
    });
  });

  describe('relPath IPC validation', () => {
    // The brokers are bare-invoked in the proxy, so had validation not caught this the handler would
    // have answered a success instead — the failure reply is the proof it never got that far.
    it.each([
      desktopBridgeStatics.channels.compiledFile,
      desktopBridgeStatics.channels.run,
      desktopBridgeStatics.channels.savedRun,
      desktopBridgeStatics.channels.savedConsole,
    ])(
      'INVALID: {channel: %s, relPath: 42} => answers with the validation failure, never reaching a broker',
      async (channel) => {
        const proxy = DesktopMainBootResponderProxy();
      proxy.setupBoot();
        await DesktopMainBootResponder({ repoPath: '/repo' });

        const result = await proxy.invokeHandler({ channel, relPath: 42 });

        expect(result).toStrictEqual({ success: false, message: RELPATH_NOT_A_STRING_MESSAGE });
      },
    );
  });
});

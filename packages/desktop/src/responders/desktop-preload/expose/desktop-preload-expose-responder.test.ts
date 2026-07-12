import { DesktopPreloadExposeResponder } from './desktop-preload-expose-responder';
import { DesktopPreloadExposeResponderProxy } from './desktop-preload-expose-responder.proxy';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

describe('DesktopPreloadExposeResponder', () => {
  describe('exposing the bridge', () => {
    it('VALID: {} => exposes the bridge and returns success', () => {
      DesktopPreloadExposeResponderProxy();

      const result = DesktopPreloadExposeResponder();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {} => delegates bridge key and all channels to the preload adapter', async () => {
      const proxy = DesktopPreloadExposeResponderProxy();

      const result = DesktopPreloadExposeResponder();

      expect(result).toStrictEqual({ success: true });
      expect(proxy.exposedBridgeKey()).toBe(desktopBridgeStatics.bridge.key);

      await proxy.triggerGetCompiledTree();

      expect(proxy.lastInvokeArgs()).toStrictEqual([desktopBridgeStatics.channels.compiledTree]);

      await proxy.triggerGetCompiledFile({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual([
        desktopBridgeStatics.channels.compiledFile,
        'src/index.ts',
      ]);
    });
  });
});

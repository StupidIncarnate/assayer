import { DesktopPreloadExposeResponder } from './desktop-preload-expose-responder';
import { DesktopPreloadExposeResponderProxy } from './desktop-preload-expose-responder.proxy';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

describe('DesktopPreloadExposeResponder', () => {
  describe('exposing the bridge', () => {
    it('VALID: {} => exposes the bridge under the bridge key', () => {
      const proxy = DesktopPreloadExposeResponderProxy();

      DesktopPreloadExposeResponder();

      expect(proxy.exposedBridgeKeys()).toStrictEqual([desktopBridgeStatics.bridge.key]);
    });

    it('VALID: {} => delegates bridge key and all channels to the preload adapter', async () => {
      const proxy = DesktopPreloadExposeResponderProxy();

      DesktopPreloadExposeResponder();

      expect(proxy.exposedBridgeKeys()).toStrictEqual([desktopBridgeStatics.bridge.key]);

      await proxy.triggerGetCompiledTree();

      expect(proxy.invokedArgsFor({ channel: desktopBridgeStatics.channels.compiledTree })).toStrictEqual([
        [desktopBridgeStatics.channels.compiledTree],
      ]);

      await proxy.triggerGetCompiledFile({ relPath: 'src/index.ts' });

      expect(proxy.invokedArgsFor({ channel: desktopBridgeStatics.channels.compiledFile })).toStrictEqual([
        [desktopBridgeStatics.channels.compiledFile, 'src/index.ts'],
      ]);
    });
  });
});

import { electronPreloadBridgeAdapter } from './electron-preload-bridge-adapter';
import { electronPreloadBridgeAdapterProxy } from './electron-preload-bridge-adapter.proxy';

describe('electronPreloadBridgeAdapter', () => {
  describe('exposing the bridge', () => {
    it('VALID: {bridgeKey, statusChannel} => exposes the bridge and returns success', () => {
      electronPreloadBridgeAdapterProxy();

      const result = electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});

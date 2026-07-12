import { electronPreloadBridgeAdapter } from './electron-preload-bridge-adapter';
import { electronPreloadBridgeAdapterProxy } from './electron-preload-bridge-adapter.proxy';

describe('electronPreloadBridgeAdapter', () => {
  describe('exposing the bridge', () => {
    it('VALID: {bridgeKey, statusChannel, compiledTreeChannel, compiledFileChannel} => exposes the bridge and returns success', () => {
      electronPreloadBridgeAdapterProxy();

      const result = electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('getCompiledTree()', () => {
    it('VALID: {compiledTreeChannel: assayer:compiled-tree} => invokes the compiled-tree channel', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
      });

      await proxy.triggerGetCompiledTree();

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:compiled-tree']);
    });
  });

  describe('getCompiledFile()', () => {
    it('VALID: {relPath: src/index.ts} => invokes the compiled-file channel with the bare relPath string', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
      });

      await proxy.triggerGetCompiledFile({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:compiled-file', 'src/index.ts']);
    });
  });
});

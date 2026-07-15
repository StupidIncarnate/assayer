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
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
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
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
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
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
      });

      await proxy.triggerGetCompiledFile({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:compiled-file', 'src/index.ts']);
    });
  });

  describe('runFile()', () => {
    it('VALID: {relPath} => invokes the run channel with the bare relPath string', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
      });

      await proxy.triggerRunFile({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:run', 'src/index.ts']);
    });
  });

  describe('getSavedRun()', () => {
    // Its own channel across the bridge too: reading what a file's last run said must never be able
    // to start one.
    it('VALID: {relPath} => invokes the saved-run channel, never the run channel', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
      });

      await proxy.triggerGetSavedRun({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:saved-run', 'src/index.ts']);
    });
  });
});

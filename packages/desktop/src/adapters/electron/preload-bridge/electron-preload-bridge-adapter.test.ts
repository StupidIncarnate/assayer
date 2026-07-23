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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });

      await proxy.triggerGetCompiledFile({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:compiled-file', 'src/index.ts']);
    });
  });

  describe('getStubs()', () => {
    it('VALID: {stubsChannel: assayer:stubs} => invokes the stubs channel with no argument', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });

      await proxy.triggerGetMergedView();

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:stubs']);
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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });

      await proxy.triggerRunFile({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:run', 'src/index.ts']);
    });

    it('VALID: {main answers a run result} => resolves with the payload, unwrapped from the reply', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();
      proxy.mainAnswers({ valueRaw: { verdicts: [] } });

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });

      const result = await proxy.triggerRunFile({ relPath: 'src/index.ts' });

      expect(result).toStrictEqual({ verdicts: [] });
    });

    // The renderer-facing half of the P1 guarantee. Electron would have built
    // `Error invoking remote method 'assayer:run': Error: <message>` had main thrown; main answers
    // instead, so what the UI catches is the broker's own sentence and nothing else. Asserting the
    // WHOLE message is the assertion — a prefix reappearing anywhere fails it.
    it('ERROR: {main failed} => rejects with the main-process message alone, with no Electron prefix', async () => {
      const proxy = electronPreloadBridgeAdapterProxy();
      proxy.mainFails({
        message: 'assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.\n\nCannot find run.json',
      });

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });

      await expect(proxy.triggerRunFile({ relPath: 'src/happy-path/switch/pure-statement/pure-statement.ts' })).rejects.toThrow(
        new Error('assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.\n\nCannot find run.json'),
      );
    });
  });

  describe('onRunOutput()', () => {
    // A run answers once but writes throughout, so this one SUBSCRIBES rather than invoking — the
    // report can only narrate the wait if it arrives during it.
    it('VALID: {a subscriber} => listens on the run-output channel and forwards what main sends', () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });
      proxy.triggerOnRunOutput();
      proxy.emitRunOutput({ chunk: 'a.ts  3/3 passed\n' });

      expect(proxy.subscribedChannels()).toStrictEqual(['assayer:run-output']);
      expect(proxy.receivedChunks()).toStrictEqual(['a.ts  3/3 passed\n']);
    });

    // The renderer cannot pass a function reference back across the contextBridge, so it could never
    // name a listener to remove — the bridge hands back the teardown instead.
    it('VALID: {the returned unsubscribe} => stops listening on the run-output channel', () => {
      const proxy = electronPreloadBridgeAdapterProxy();

      electronPreloadBridgeAdapter({
        bridgeKey: 'assayerBridge',
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });
      proxy.triggerOnRunOutput();
      proxy.triggerUnsubscribeRunOutput();

      expect(proxy.removedChannels()).toStrictEqual(['assayer:run-output']);
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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        runOutputChannel: 'assayer:run-output',
      });

      await proxy.triggerGetSavedRun({ relPath: 'src/index.ts' });

      expect(proxy.lastInvokeArgs()).toStrictEqual(['assayer:saved-run', 'src/index.ts']);
    });
  });
});

import { CompiledTreeStub } from '@assayer/shared/contracts';

import { assayerBridgeGetCompiledTreeAdapter } from './assayer-bridge-get-compiled-tree-adapter';
import { assayerBridgeGetCompiledTreeAdapterProxy } from './assayer-bridge-get-compiled-tree-adapter.proxy';

describe('assayerBridgeGetCompiledTreeAdapter', () => {
  describe('reading the bridge compiled tree', () => {
    it('VALID: {bridge resolves tree} => returns the compiled tree', async () => {
      const proxy = assayerBridgeGetCompiledTreeAdapterProxy();
      const tree = CompiledTreeStub();
      proxy.returns({ tree });

      const result = await assayerBridgeGetCompiledTreeAdapter();

      expect(result).toStrictEqual(tree);
    });

    it('EDGE: {tree with empty nodes} => returns the compiled tree with no nodes', async () => {
      const proxy = assayerBridgeGetCompiledTreeAdapterProxy();
      const tree = CompiledTreeStub({ nodes: [] });
      proxy.returns({ tree });

      const result = await assayerBridgeGetCompiledTreeAdapter();

      expect(result).toStrictEqual(tree);
    });
  });

  describe('when the preload bridge is absent', () => {
    it('ERROR: {window.assayerBridge.getCompiledTree undefined} => throws an actionable preload-unavailable error', async () => {
      const proxy = assayerBridgeGetCompiledTreeAdapterProxy();
      proxy.absent();

      await expect(assayerBridgeGetCompiledTreeAdapter()).rejects.toThrow(
        /^Assayer preload bridge unavailable: window\.assayerBridge was not exposed by the Electron preload\./u,
      );
    });
  });
});

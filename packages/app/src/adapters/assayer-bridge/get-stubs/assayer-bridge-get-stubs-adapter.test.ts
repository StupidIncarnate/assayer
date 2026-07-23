import { StubViewStub } from '@assayer/shared/contracts';

import { assayerBridgeGetStubsAdapter } from './assayer-bridge-get-stubs-adapter';
import { assayerBridgeGetStubsAdapterProxy } from './assayer-bridge-get-stubs-adapter.proxy';

describe('assayerBridgeGetStubsAdapter', () => {
  describe('reading the bridge stub view', () => {
    it('VALID: {bridge resolves stub view} => returns the stub view', async () => {
      const proxy = assayerBridgeGetStubsAdapterProxy();
      const view = StubViewStub();
      proxy.returns({ view });

      const result = await assayerBridgeGetStubsAdapter();

      expect(result).toStrictEqual(view);
    });

    it('EMPTY: {view with no stubs} => returns the empty stub view', async () => {
      const proxy = assayerBridgeGetStubsAdapterProxy();
      const view = StubViewStub({ objectStubs: [], envStubs: [] });
      proxy.returns({ view });

      const result = await assayerBridgeGetStubsAdapter();

      expect(result).toStrictEqual(view);
    });
  });

  describe('when the preload bridge is absent', () => {
    it('ERROR: {window.assayerBridge.getStubs undefined} => throws an actionable preload-unavailable error', async () => {
      const proxy = assayerBridgeGetStubsAdapterProxy();
      proxy.absent();

      await expect(assayerBridgeGetStubsAdapter()).rejects.toThrow(
        /^Assayer preload bridge unavailable: window\.assayerBridge was not exposed by the Electron preload\./u,
      );
    });
  });
});

import { RunResultStub, RelPathStub } from '@assayer/shared/contracts';

import { assayerBridgeRunFileAdapter } from './assayer-bridge-run-file-adapter';
import { assayerBridgeRunFileAdapterProxy } from './assayer-bridge-run-file-adapter.proxy';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

describe('assayerBridgeRunFileAdapter', () => {
  describe('a run over the bridge', () => {
    it('VALID: {a file} => the validated run', async () => {
      const proxy = assayerBridgeRunFileAdapterProxy();
      proxy.returns({ run: RunResultStub() });

      const result = await assayerBridgeRunFileAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('a run that failed to happen', () => {
    // The main process's message is the product surface — it says WHY nothing ran.
    it('ERROR: {the run threw} => the message reaches the caller', async () => {
      const proxy = assayerBridgeRunFileAdapterProxy();
      proxy.fails({ message: 'assayer: the CLI is not built, so nothing can be run.' });

      await expect(assayerBridgeRunFileAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) })).rejects.toThrow(
        /the CLI is not built/u,
      );
    });
  });

  describe('no bridge', () => {
    it('ERROR: {preload never ran} => the shared unavailable diagnostic', async () => {
      const proxy = assayerBridgeRunFileAdapterProxy();
      proxy.absent();

      await expect(assayerBridgeRunFileAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) })).rejects.toThrow(
        preloadBridgeStatics.unavailableMessage,
      );
    });
  });
});

import { assayerBridgeGetStatusAdapter } from './assayer-bridge-get-status-adapter';
import { assayerBridgeGetStatusAdapterProxy } from './assayer-bridge-get-status-adapter.proxy';
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

describe('assayerBridgeGetStatusAdapter', () => {
  describe('reading the bridge status', () => {
    it('VALID: {bridge resolves status} => returns the status view', async () => {
      const proxy = assayerBridgeGetStatusAdapterProxy();
      proxy.returns({ status: StatusViewStub({ repoPath: '/tmp/target-repo' }) });

      const result = await assayerBridgeGetStatusAdapter();

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/tmp/target-repo',
      });
    });
  });
});

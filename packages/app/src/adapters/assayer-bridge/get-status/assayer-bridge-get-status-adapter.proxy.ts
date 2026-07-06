/**
 * WHY MOCK ADAPTER: the preload contextBridge (window.assayerBridge) is a runtime global
 * injected by Electron, not an npm package. Like the runtime dynamic-import adapter, this
 * adapter mocks itself — registerMock triggers the AST transformer's jest.mock, then values
 * are set directly on the jest.fn().
 */
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { assayerBridgeGetStatusAdapter } from './assayer-bridge-get-status-adapter';
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

registerMock({ fn: assayerBridgeGetStatusAdapter });

export const assayerBridgeGetStatusAdapterProxy = (): {
  returns: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  const mock = assayerBridgeGetStatusAdapter as unknown as jest.Mock;

  mock.mockResolvedValue(StatusViewStub());

  return {
    returns: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      mock.mockResolvedValue(status);
    },
  };
};

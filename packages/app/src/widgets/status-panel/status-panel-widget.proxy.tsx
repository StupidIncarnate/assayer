import { useAssayerStatusBindingProxy } from '../../bindings/use-assayer-status/use-assayer-status-binding.proxy';
import type { StatusViewStub } from '../../contracts/status-view/status-view.stub';

export const StatusPanelWidgetProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  const bindingProxy = useAssayerStatusBindingProxy();

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      bindingProxy.setupStatus({ status });
    },
  };
};

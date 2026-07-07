import { reactCreateElementAdapterProxy } from '../../../adapters/react/create-element/react-create-element-adapter.proxy';
import { StatusPanelWidgetProxy } from '../../../widgets/status-panel/status-panel-widget.proxy';
import type { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

export const StatusPageResponderProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  reactCreateElementAdapterProxy();
  const widgetProxy = StatusPanelWidgetProxy();

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      widgetProxy.setupStatus({ status });
    },
  };
};

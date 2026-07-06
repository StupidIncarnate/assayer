import { StatusPanelWidgetProxy } from '../status-panel/status-panel-widget.proxy';
import type { StatusViewStub } from '../../contracts/status-view/status-view.stub';

export const AppRouterWidgetProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  const widgetProxy = StatusPanelWidgetProxy();

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      widgetProxy.setupStatus({ status });
    },
  };
};

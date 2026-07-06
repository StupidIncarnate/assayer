import { reactCreateElementAdapterProxy } from '../../../adapters/react/create-element/react-create-element-adapter.proxy';
import { reactDomMountAdapterProxy } from '../../../adapters/react-dom/mount/react-dom-mount-adapter.proxy';
import { AppRouterWidgetProxy } from '../../../widgets/app-router/app-router-widget.proxy';
import type { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

export const AppMountResponderProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  reactCreateElementAdapterProxy();
  reactDomMountAdapterProxy();
  const routerProxy = AppRouterWidgetProxy();

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      routerProxy.setupStatus({ status });
    },
  };
};

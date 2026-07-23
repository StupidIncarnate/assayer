import { reactCreateElementAdapterProxy } from '../../../adapters/react/create-element/react-create-element-adapter.proxy';
import { StubRepositoryWidgetProxy } from '../../../widgets/stub-repository/stub-repository-widget.proxy';
import type { StubViewStub } from '@assayer/shared/contracts';

export const StubsPageResponderProxy = (): {
  setupView: (params: { view: ReturnType<typeof StubViewStub> }) => void;
} => {
  reactCreateElementAdapterProxy();
  const widgetProxy = StubRepositoryWidgetProxy();

  return {
    setupView: ({ view }: { view: ReturnType<typeof StubViewStub> }): void => {
      widgetProxy.setupView({ view });
    },
  };
};

import { reactCreateElementAdapterProxy } from '../../../adapters/react/create-element/react-create-element-adapter.proxy';
import { SurfaceExplorerWidgetProxy } from '../../../widgets/surface-explorer/surface-explorer-widget.proxy';
import type { CompiledTreeStub } from '@assayer/shared/contracts';

export const ExplorerPageResponderProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
} => {
  reactCreateElementAdapterProxy();
  const widgetProxy = SurfaceExplorerWidgetProxy();

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      widgetProxy.setupTree({ tree });
    },
  };
};

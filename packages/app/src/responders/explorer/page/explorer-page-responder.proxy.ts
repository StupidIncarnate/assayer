import { SurfaceExplorerWidgetProxy } from '../../../widgets/surface-explorer/surface-explorer-widget.proxy';
import type { CompiledTreeStub } from '@assayer/shared/contracts/compiled-tree/compiled-tree.stub';

export const ExplorerPageResponderProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
} => {
  const widgetProxy = SurfaceExplorerWidgetProxy();

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      widgetProxy.setupTree({ tree });
    },
  };
};

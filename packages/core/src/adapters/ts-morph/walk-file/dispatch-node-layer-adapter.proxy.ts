import { handleBlockLayerAdapterProxy } from './handle-block-layer-adapter.proxy';
import { handleCallLayerAdapterProxy } from './handle-call-layer-adapter.proxy';
import { handleClassLayerAdapterProxy } from './handle-class-layer-adapter.proxy';
import { handleExitLayerAdapterProxy } from './handle-exit-layer-adapter.proxy';
import { handleFunctionLayerAdapterProxy } from './handle-function-layer-adapter.proxy';
import { handleIfLayerAdapterProxy } from './handle-if-layer-adapter.proxy';
import { handleSourceFileLayerAdapterProxy } from './handle-source-file-layer-adapter.proxy';
import { handleSwitchLayerAdapterProxy } from './handle-switch-layer-adapter.proxy';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';

export const dispatchNodeLayerAdapterProxy = (): Record<PropertyKey, never> => {
  handleBlockLayerAdapterProxy();
  handleCallLayerAdapterProxy();
  handleClassLayerAdapterProxy();
  handleExitLayerAdapterProxy();
  handleFunctionLayerAdapterProxy();
  handleIfLayerAdapterProxy();
  handleSourceFileLayerAdapterProxy();
  handleSwitchLayerAdapterProxy();
  handlerResultLayerAdapterProxy();

  return {};
};

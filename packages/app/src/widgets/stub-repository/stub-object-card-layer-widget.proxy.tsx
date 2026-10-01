import { StubPropertyRowLayerWidgetProxy } from './stub-property-row-layer-widget.proxy';
import { StubReadersLayerWidgetProxy } from './stub-readers-layer-widget.proxy';

export const StubObjectCardLayerWidgetProxy = (): Record<PropertyKey, never> => {
  StubPropertyRowLayerWidgetProxy();
  StubReadersLayerWidgetProxy();

  return {};
};

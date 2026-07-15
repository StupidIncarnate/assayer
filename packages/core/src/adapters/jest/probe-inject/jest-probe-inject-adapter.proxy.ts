import { probeVisitNodeLayerAdapterProxy } from './probe-visit-node-layer-adapter.proxy';

export const jestProbeInjectAdapterProxy = (): Record<PropertyKey, never> => {
  probeVisitNodeLayerAdapterProxy();

  return {};
};

import { probeVisitNodeLayerTransformerProxy } from './probe-visit-node-layer-transformer.proxy';

export const probeInjectTransformerProxy = (): Record<PropertyKey, never> => {
  probeVisitNodeLayerTransformerProxy();

  return {};
};

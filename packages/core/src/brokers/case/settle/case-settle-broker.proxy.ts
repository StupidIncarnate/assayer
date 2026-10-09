import { drainGeneratorLayerBrokerProxy } from './drain-generator-layer-broker.proxy';

export const caseSettleBrokerProxy = (): Record<PropertyKey, never> => {
  drainGeneratorLayerBrokerProxy();

  return {};
};

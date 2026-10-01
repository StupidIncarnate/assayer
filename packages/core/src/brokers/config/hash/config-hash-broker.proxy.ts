import { contentHashTransformerProxy } from '../../../transformers/content-hash/content-hash-transformer.proxy';

export const configHashBrokerProxy = (): Record<PropertyKey, never> => {
  contentHashTransformerProxy();

  return {};
};

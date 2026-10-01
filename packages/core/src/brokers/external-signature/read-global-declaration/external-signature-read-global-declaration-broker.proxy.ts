import { readGlobalTypeLayerBrokerProxy } from './read-global-type-layer-broker.proxy';

// The adapter reads real ambient declarations through a real node_modules-aware ts-morph project —
// exactly the resolution logic the tests must validate — so nothing is mocked; the child runs real too.
export const externalSignatureReadGlobalDeclarationBrokerProxy = (): Record<PropertyKey, never> => {
  readGlobalTypeLayerBrokerProxy();

  return {};
};

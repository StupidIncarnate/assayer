import { readGlobalTypeLayerAdapterProxy } from './read-global-type-layer-adapter.proxy';

// The adapter reads real ambient declarations through a real node_modules-aware ts-morph project —
// exactly the resolution logic the tests must validate — so nothing is mocked; the child runs real too.
export const tsMorphReadGlobalSignatureAdapterProxy = (): Record<PropertyKey, never> => {
  readGlobalTypeLayerAdapterProxy();

  return {};
};

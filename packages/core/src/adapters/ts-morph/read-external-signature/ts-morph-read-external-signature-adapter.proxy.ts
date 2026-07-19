import { readSignatureTypeLayerAdapterProxy } from './read-signature-type-layer-adapter.proxy';

// The adapter reads real `.d.ts` files through a real node_modules-aware ts-morph project — exactly
// the resolution logic the tests must validate — so nothing is mocked; the child layer runs real too.
export const tsMorphReadExternalSignatureAdapterProxy = (): Record<PropertyKey, never> => {
  readSignatureTypeLayerAdapterProxy();

  return {};
};

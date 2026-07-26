import { readHarnessValueTypeLayerAdapterProxy } from './read-harness-value-type-layer-adapter.proxy';

// The adapter parses real harness source through a real hermetic ts-morph project — exactly the
// resolution logic the tests must validate — so nothing is mocked; the child layer runs real too.
export const tsMorphReadHarnessValueTypesAdapterProxy = (): Record<PropertyKey, never> => {
  readHarnessValueTypeLayerAdapterProxy();

  return {};
};

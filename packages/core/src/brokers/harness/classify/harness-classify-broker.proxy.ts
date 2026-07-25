import { typescriptHarnessGateAdapterProxy } from '../../../adapters/typescript/harness-gate/typescript-harness-gate-adapter.proxy';

// The gate parses real source and its answer IS what classification means, so it runs real — a stubbed
// gate would prove the partition and nothing about which files reach it.
export const harnessClassifyBrokerProxy = (): Record<PropertyKey, never> => {
  typescriptHarnessGateAdapterProxy();

  return {};
};

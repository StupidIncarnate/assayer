import { isAssayerHarnessGuardProxy } from '../../../guards/is-assayer-harness/is-assayer-harness-guard.proxy';

// The gate parses real source and its answer IS what classification means, so it runs real — a stubbed
// gate would prove the partition and nothing about which files reach it.
export const harnessClassifyBrokerProxy = (): Record<PropertyKey, never> => {
  isAssayerHarnessGuardProxy();

  return {};
};

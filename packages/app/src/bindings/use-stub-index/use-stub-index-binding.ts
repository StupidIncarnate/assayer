/**
 * PURPOSE: React hook that subscribes to the stub-index fetch broker, exposing loading/error/data
 *   state to the stub-repository view.
 *
 * USAGE:
 * const { data, loading, error } = useStubIndexBinding();
 * // Returns { data: StubView | null, loading: boolean, error: Error | null }
 */
import { useStubIndexResultContract } from '../../contracts/use-stub-index-result/use-stub-index-result-contract';
import type { UseStubIndexResult } from '../../contracts/use-stub-index-result/use-stub-index-result-contract';
import { useEffect, useMemo, useState } from '#gateway/npm/react';

import { stubIndexFetchBroker } from '../../brokers/stub-index/fetch/stub-index-fetch-broker';
import type { StubView } from '@assayer/shared/contracts';

export const useStubIndexBinding = (): UseStubIndexResult => {
  const [data, setData] = useState<StubView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    stubIndexFetchBroker()
      .then(setData)
      .catch(setError)
      .finally(() => { setLoading(false); });
  }, []);

  return useMemo(
    () => useStubIndexResultContract.parse({ data, loading, error }),
    [data, loading, error],
  );
};

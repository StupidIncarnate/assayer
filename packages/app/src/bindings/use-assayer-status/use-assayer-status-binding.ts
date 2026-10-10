/**
 * PURPOSE: React hook that subscribes to the assayer status broker, exposing loading/error/data
 *   state to the status widget.
 *
 * USAGE:
 * const { data, loading, error } = useAssayerStatusBinding();
 * // Returns { data: StatusView | null, loading: boolean, error: Error | null }
 */
import { useAssayerStatusResultContract } from '../../contracts/use-assayer-status-result/use-assayer-status-result-contract';
import type { UseAssayerStatusResult } from '../../contracts/use-assayer-status-result/use-assayer-status-result-contract';
import { useEffect, useMemo, useState } from '#gateway/npm/react';

import { statusFetchBroker } from '../../brokers/status/fetch/status-fetch-broker';
import type { StatusView } from '../../contracts/status-view/status-view-contract';

export const useAssayerStatusBinding = (): UseAssayerStatusResult => {
  const [data, setData] = useState<StatusView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    statusFetchBroker()
      .then(setData)
      .catch(setError)
      .finally(() => { setLoading(false); });
  }, []);

  return useMemo(
    () => useAssayerStatusResultContract.parse({ data, loading, error }),
    [data, loading, error],
  );
};

/**
 * PURPOSE: React hook that subscribes to the compiled-tree fetch broker, exposing loading/error/data
 *   state to the surface explorer.
 *
 * USAGE:
 * const { data, loading, error } = useCompiledTreeBinding();
 * // Returns { data: CompiledTree | null, loading: boolean, error: Error | null }
 */
import { useEffect, useState } from 'react';

import { compiledTreeFetchBroker } from '../../brokers/compiled-tree/fetch/compiled-tree-fetch-broker';
import type { CompiledTree } from '@assayer/shared/contracts';

export const useCompiledTreeBinding = (): {
  data: CompiledTree | null;
  loading: boolean;
  error: Error | null;
} => {
  const [data, setData] = useState<CompiledTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    compiledTreeFetchBroker()
      .then(setData)
      .catch(setError)
      .finally(() => { setLoading(false); });
  }, []);

  return { data, loading, error };
};

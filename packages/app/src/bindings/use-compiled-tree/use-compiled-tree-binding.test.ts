import { useCompiledTreeBinding } from './use-compiled-tree-binding';
import { useCompiledTreeBindingProxy } from './use-compiled-tree-binding.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts';
import { renderHook, waitFor } from '#gateway/npm/testing-library__react';

describe('useCompiledTreeBinding', () => {
  describe('successful fetch', () => {
    it('VALID: {bridge resolves tree} => returns the compiled tree after loading', async () => {
      const proxy = useCompiledTreeBindingProxy();
      const tree = CompiledTreeStub();
      proxy.setupTree({ tree });

      const { result } = renderHook(() => useCompiledTreeBinding());
      const currentState = (): ReturnType<typeof useCompiledTreeBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        loading: false,
        error: null,
        data: tree,
      });
    });
  });

  describe('initial state', () => {
    it('EMPTY: {before bridge resolves} => returns loading state with no data or error', () => {
      const proxy = useCompiledTreeBindingProxy();
      const tree = CompiledTreeStub();
      proxy.setupTree({ tree });

      const { result } = renderHook(() => useCompiledTreeBinding());

      expect(result.current).toStrictEqual({ data: null, loading: true, error: null });
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {bridge rejects} => returns the error after loading', async () => {
      const proxy = useCompiledTreeBindingProxy();
      const error = new Error('bridge failed');
      proxy.rejects({ error });

      const { result } = renderHook(() => useCompiledTreeBinding());
      const currentState = (): ReturnType<typeof useCompiledTreeBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({ loading: false, data: null, error });
    });
  });
});

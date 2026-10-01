import { useStubIndexBinding } from './use-stub-index-binding';
import { useStubIndexBindingProxy } from './use-stub-index-binding.proxy';
import { StubViewStub } from '@assayer/shared/contracts/stub-view/stub-view.stub';
import { renderHook, waitFor } from '#gateway/npm/testing-library__react';

describe('useStubIndexBinding', () => {
  describe('successful fetch', () => {
    it('VALID: {bridge resolves stub view} => returns the stub view after loading', async () => {
      const proxy = useStubIndexBindingProxy();
      const view = StubViewStub();
      proxy.setupView({ view });

      const { result } = renderHook(() => useStubIndexBinding());
      const currentState = (): ReturnType<typeof useStubIndexBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        loading: false,
        error: null,
        data: view,
      });
    });
  });

  describe('initial state', () => {
    it('EMPTY: {before bridge resolves} => returns loading state with no data or error', () => {
      const proxy = useStubIndexBindingProxy();
      const view = StubViewStub();
      proxy.setupView({ view });

      const { result } = renderHook(() => useStubIndexBinding());

      expect(result.current).toStrictEqual({ data: null, loading: true, error: null });
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {bridge rejects} => returns the error after loading', async () => {
      const proxy = useStubIndexBindingProxy();
      const error = new Error('bridge failed');
      proxy.rejects({ error });

      const { result } = renderHook(() => useStubIndexBinding());
      const currentState = (): ReturnType<typeof useStubIndexBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(result.current).toStrictEqual({ loading: false, data: null, error });
    });
  });
});

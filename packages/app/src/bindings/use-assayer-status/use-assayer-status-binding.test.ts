import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useAssayerStatusBinding } from './use-assayer-status-binding';
import { useAssayerStatusBindingProxy } from './use-assayer-status-binding.proxy';
import { StatusViewStub } from '../../contracts/status-view/status-view.stub';
import { renderHook } from '#gateway/npm/testing-library__react';

describe('useAssayerStatusBinding', () => {
  describe('successful fetch', () => {
    it('VALID: {bridge resolves status} => returns the status view after loading', async () => {
      const proxy = useAssayerStatusBindingProxy();
      const status = StatusViewStub({ message: 'Assayer core online' });
      proxy.setupStatus({ status });

      const { result } = renderHook(() => useAssayerStatusBinding());
      const currentState = (): ReturnType<typeof useAssayerStatusBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        loading: false,
        error: null,
        data: {
          version: '1.0.0',
          message: 'Assayer core online',
          repoPath: '/home/user/project',
          runMode: 'thorough',
        },
      });
    });
  });
});

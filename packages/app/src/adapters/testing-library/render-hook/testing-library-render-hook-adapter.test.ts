import { testingLibraryRenderHookAdapter } from './testing-library-render-hook-adapter';
import { testingLibraryRenderHookAdapterProxy } from './testing-library-render-hook-adapter.proxy';

describe('testingLibraryRenderHookAdapter', () => {
  describe('rendering a hook', () => {
    it('VALID: {renderCallback} => returns the hook current value', () => {
      testingLibraryRenderHookAdapterProxy();

      const { result } = testingLibraryRenderHookAdapter({ renderCallback: () => 'ready' });

      expect(result.current).toBe('ready');
    });
  });
});

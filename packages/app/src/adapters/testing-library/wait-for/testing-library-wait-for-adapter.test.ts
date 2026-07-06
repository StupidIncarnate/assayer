import { testingLibraryWaitForAdapter } from './testing-library-wait-for-adapter';
import { testingLibraryWaitForAdapterProxy } from './testing-library-wait-for-adapter.proxy';

describe('testingLibraryWaitForAdapter', () => {
  describe('awaiting a passing callback', () => {
    it('VALID: {callback resolves} => returns success', async () => {
      testingLibraryWaitForAdapterProxy();

      const result = await testingLibraryWaitForAdapter({ callback: () => undefined });

      expect(result).toStrictEqual({ success: true });
    });
  });
});

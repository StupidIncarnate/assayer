import { assayerCoreStatusAdapter } from './assayer-core-status-adapter';
import { assayerCoreStatusAdapterProxy } from './assayer-core-status-adapter.proxy';

describe('assayerCoreStatusAdapter', () => {
  describe('core status', () => {
    it('VALID: {} => returns the core status result', () => {
      assayerCoreStatusAdapterProxy();

      const result = assayerCoreStatusAdapter();

      expect(result).toStrictEqual({ version: '1.0.0', message: 'Assayer core online' });
    });
  });
});

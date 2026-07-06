import { statusGetBroker } from './status-get-broker';
import { statusGetBrokerProxy } from './status-get-broker.proxy';

describe('statusGetBroker', () => {
  describe('core status', () => {
    it('VALID: {} => returns the current version and readiness message', () => {
      statusGetBrokerProxy();

      const result = statusGetBroker();

      expect(result).toStrictEqual({ version: '1.0.0', message: 'Assayer core online' });
    });
  });
});

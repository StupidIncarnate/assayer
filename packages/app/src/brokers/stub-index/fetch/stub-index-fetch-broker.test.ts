import { StubViewStub } from '@assayer/shared/contracts';

import { stubIndexFetchBroker } from './stub-index-fetch-broker';
import { stubIndexFetchBrokerProxy } from './stub-index-fetch-broker.proxy';

describe('stubIndexFetchBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {bridge resolves stub view} => returns the stub view', async () => {
      const proxy = stubIndexFetchBrokerProxy();
      const view = StubViewStub();
      proxy.setupView({ view });

      const result = await stubIndexFetchBroker();

      expect(result).toStrictEqual(view);
    });
  });

  describe('failed fetch', () => {
    it('ERROR: {bridge rejects} => propagates the error', async () => {
      const proxy = stubIndexFetchBrokerProxy();
      const error = new Error('bridge failed');
      proxy.rejects({ error });

      await expect(stubIndexFetchBroker()).rejects.toThrow(/^bridge failed$/u);
    });
  });
});

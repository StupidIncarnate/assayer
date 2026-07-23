import { statusFetchBroker } from './status-fetch-broker';
import { statusFetchBrokerProxy } from './status-fetch-broker.proxy';
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

describe('statusFetchBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {bridge resolves status} => returns the status view', async () => {
      const proxy = statusFetchBrokerProxy();
      const status = StatusViewStub({ message: 'Assayer core ready' });
      proxy.setupStatus({ status });

      const result = await statusFetchBroker();

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core ready',
        repoPath: '/home/user/project',
        runMode: 'thorough',
      });
    });
  });
});

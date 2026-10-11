import { statusResolveBroker } from './status-resolve-broker';
import { statusResolveBrokerProxy } from './status-resolve-broker.proxy';

describe('statusResolveBroker', () => {
  describe('status payload', () => {
    it('VALID: {repoPath} => returns core status combined with the repo path', () => {
      statusResolveBrokerProxy();
      const repoPath = '/tmp/target';

      const result = statusResolveBroker({ repoPath });

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/tmp/target',
      });
    });
  });
});

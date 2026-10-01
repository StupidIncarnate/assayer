import { statusResolveBroker } from './status-resolve-broker';
import { statusResolveBrokerProxy } from './status-resolve-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('statusResolveBroker', () => {
  describe('status payload', () => {
    it('VALID: {repoPath, config runMode default} => returns core status combined with the repo path and thorough mode', async () => {
      const proxy = statusResolveBrokerProxy();
      proxy.configDefaults({ repoPath: '/tmp/target' });
      const repoPath = RepoPathStub({ value: '/tmp/target' });

      const result = await statusResolveBroker({ repoPath });

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/tmp/target',
        runMode: 'thorough',
      });
    });

    it('VALID: {config runMode intelligent} => carries the display-only run mode into the status payload', async () => {
      const proxy = statusResolveBrokerProxy();
      proxy.configRunMode({ repoPath: '/tmp/target', runMode: 'intelligent' });
      const repoPath = RepoPathStub({ value: '/tmp/target' });

      const result = await statusResolveBroker({ repoPath });

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/tmp/target',
        runMode: 'intelligent',
      });
    });

    it('EMPTY: {no config found} => defaults to thorough so a repo without a config reads every case live', async () => {
      const proxy = statusResolveBrokerProxy();
      proxy.configAbsent({ searchedDirs: ['/tmp/target', '/tmp', '/'] });
      const repoPath = RepoPathStub({ value: '/tmp/target' });

      const result = await statusResolveBroker({ repoPath });

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/tmp/target',
        runMode: 'thorough',
      });
    });
  });
});

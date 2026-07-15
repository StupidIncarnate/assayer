import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';
import { repoSourceRootBroker } from './repo-source-root-broker';
import { repoSourceRootBrokerProxy } from './repo-source-root-broker.proxy';

describe('repoSourceRootBroker', () => {
  describe('a config with no repoRoot of its own', () => {
    it('VALID: {repoRoot: "."} => the config dir itself', async () => {
      repoSourceRootBrokerProxy();

      const result = await repoSourceRootBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(String(result)).toBe('/repo');
    });
  });

  describe('a config that points elsewhere', () => {
    // The case that breaks a caller assuming configDir IS the source root: the cache stays at /repo
    // while the code lives a level down, and reading source from /repo finds nothing.
    it('VALID: {repoRoot: "./smoke-repo"} => resolved under the config dir', async () => {
      const proxy = repoSourceRootBrokerProxy();
      proxy.configHasRepoRoot({ repoRoot: './smoke-repo' });

      const result = await repoSourceRootBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(String(result)).toBe('/repo/smoke-repo');
    });
  });

  describe('a repo with no usable config', () => {
    it('ERROR: {unreadable config} => throws naming the file and how to make one', async () => {
      const proxy = repoSourceRootBrokerProxy();
      proxy.configUnreadable({ message: 'Unexpected end of JSON input' });

      await expect(repoSourceRootBroker({ repoPath: RepoPathStub({ value: '/repo' }) })).rejects.toThrow(
        /assayer status/u,
      );
    });
  });
});

import { StatusIpcResponder } from './status-ipc-responder';
import { StatusIpcResponderProxy } from './status-ipc-responder.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('StatusIpcResponder', () => {
  describe('status payload', () => {
    it('VALID: {repoPath} => returns core status combined with the repo path', () => {
      StatusIpcResponderProxy();
      const repoPath = RepoPathStub({ value: '/tmp/target' });

      const result = StatusIpcResponder({ repoPath });

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/tmp/target',
      });
    });
  });
});

import { repoPathContract } from './repo-path-contract';
import { RepoPathStub } from './repo-path.stub';

describe('repoPathContract', () => {
  describe('valid repo paths', () => {
    it('VALID: {value: "/home/user/project"} => parses successfully', () => {
      const repoPath = RepoPathStub({ value: '/home/user/project' });

      const result = repoPathContract.parse(repoPath);

      expect(result).toBe('/home/user/project');
    });
  });

  describe('invalid repo paths', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return repoPathContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});

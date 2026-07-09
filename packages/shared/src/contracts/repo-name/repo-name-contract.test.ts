import { repoNameContract } from './repo-name-contract';
import { RepoNameStub } from './repo-name.stub';

describe('repoNameContract', () => {
  describe('valid repo names', () => {
    it('VALID: {value: "assayer"} => parses successfully', () => {
      const name = RepoNameStub({ value: 'assayer' });

      const result = repoNameContract.parse(name);

      expect(result).toBe('assayer');
    });
  });

  describe('invalid repo names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return repoNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});

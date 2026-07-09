import { branchNameContract } from './branch-name-contract';
import { BranchNameStub } from './branch-name.stub';

describe('branchNameContract', () => {
  describe('valid branch names', () => {
    it('VALID: {value: "master"} => parses successfully', () => {
      const result = branchNameContract.parse('master');

      expect(result).toBe('master');
    });

    it('VALID: {value: "detached-abc1234"} => parses successfully', () => {
      const result = branchNameContract.parse('detached-abc1234');

      expect(result).toBe('detached-abc1234');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const branch = BranchNameStub();

      const result = branchNameContract.parse(branch);

      expect(result).toBe('master');
    });
  });

  describe('invalid branch names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return branchNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});

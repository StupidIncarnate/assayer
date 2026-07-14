import { branchNodeContract } from './branch-node-contract';
import { BranchNodeStub } from './branch-node.stub';

describe('branchNodeContract', () => {
  describe('valid branch nodes', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const node = BranchNodeStub();

      const result = branchNodeContract.parse(node);

      expect(result).toStrictEqual(node);
    });
  });

  describe('invalid branch nodes', () => {
    it('INVALID: {kind: "loop"} => throws validation error', () => {
      expect(() => {
        return branchNodeContract.parse({
          coverageId: 'formatGreeting/if:BinaryExpression,id:name',
          kind: 'loop',
          operandType: { kind: 'string' },
          predicate: { kind: 'length-eq-zero' },
          startLine: 2,
          endLine: 4,
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});

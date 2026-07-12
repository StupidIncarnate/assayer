import { treeNodeNameContract } from './tree-node-name-contract';
import { TreeNodeNameStub } from './tree-node-name.stub';

describe('treeNodeNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "index.ts"} => parses successfully', () => {
      const result = treeNodeNameContract.parse('index.ts');

      expect(result).toBe('index.ts');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const name = TreeNodeNameStub();

      const result = treeNodeNameContract.parse(name);

      expect(result).toBe('index.ts');
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return treeNodeNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});

import { treeNodeKindContract } from './tree-node-kind-contract';
import { TreeNodeKindStub } from './tree-node-kind.stub';

describe('treeNodeKindContract', () => {
  describe('valid tree node kinds', () => {
    it('VALID: {value: "dir"} => parses successfully', () => {
      const kind = TreeNodeKindStub({ value: 'dir' });

      const result = treeNodeKindContract.parse(kind);

      expect(result).toBe('dir');
    });

    it('VALID: {value: "file"} => parses successfully', () => {
      const result = treeNodeKindContract.parse('file');

      expect(result).toBe('file');
    });
  });

  describe('invalid tree node kinds', () => {
    it('INVALID: {value: "symlink"} => throws validation error', () => {
      expect(() => {
        return treeNodeKindContract.parse('symlink');
      }).toThrow(/Invalid enum value/u);
    });
  });
});

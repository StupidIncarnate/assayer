import { walkNodeContract } from './walk-node-contract';
import { WalkNodeStub } from './walk-node.stub';

describe('walkNodeContract', () => {
  describe('valid walk nodes', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const node = WalkNodeStub();

      const result = walkNodeContract.parse(node);

      expect(result).toStrictEqual(node);
    });

    it('VALID: {handled: false} => parses an unhandled node (a dark spot in the making)', () => {
      const node = WalkNodeStub({ kind: 'ForStatement', handled: false, startLine: 3, endLine: 5 });

      const result = walkNodeContract.parse(node);

      expect(result).toStrictEqual(node);
    });

    it('VALID: {name} => parses a named node', () => {
      const node = WalkNodeStub({ kind: 'FunctionDeclaration', name: 'classify', startLine: 1, endLine: 7 });

      const result = walkNodeContract.parse(node);

      expect(result).toStrictEqual(node);
    });
  });

  describe('invalid walk nodes', () => {
    it('EMPTY: {kind: ""} => throws validation error', () => {
      expect(() => {
        return walkNodeContract.parse({ kind: '', scopePath: [], startLine: 1, endLine: 2, handled: true });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {handled: "yes"} => throws validation error', () => {
      expect(() => {
        return walkNodeContract.parse({ kind: 'IfStatement', scopePath: [], startLine: 1, endLine: 2, handled: 'yes' });
      }).toThrow(/Expected boolean/u);
    });
  });
});

import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { mapProjectionTransformer } from './map-projection-transformer';

describe('mapProjectionTransformer', () => {
  describe('the kinds it surfaces', () => {
    it('VALID: {the four mapped kinds} => each projected to its map vocabulary', () => {
      const walked = WalkFileResultStub({
        nodes: [
          WalkNodeStub({ kind: 'FunctionDeclaration', name: 'classify', startLine: 1, endLine: 9 }),
          WalkNodeStub({ kind: 'IfStatement', startLine: 2, endLine: 4 }),
          WalkNodeStub({ kind: 'ConditionalExpression', startLine: 5, endLine: 5 }),
          WalkNodeStub({ kind: 'SwitchStatement', startLine: 6, endLine: 8 }),
        ],
      });

      expect(mapProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        nodes: [
          { kind: 'function', name: 'classify', startLine: 1, endLine: 9 },
          { kind: 'if', startLine: 2, endLine: 4 },
          { kind: 'ternary', startLine: 5, endLine: 5 },
          { kind: 'switch', startLine: 6, endLine: 8 },
        ],
      });
    });

    it('VALID: {an unmapped kind} => dropped, because it has never been drawn on the map', () => {
      const walked = WalkFileResultStub({
        nodes: [
          WalkNodeStub({ kind: 'ForOfStatement', startLine: 1, endLine: 3, handled: false }),
          WalkNodeStub({ kind: 'MethodDeclaration', name: 'm', startLine: 4, endLine: 5 }),
        ],
      });

      expect(mapProjectionTransformer({ walked })).toStrictEqual({ success: true, nodes: [] });
    });

    it('VALID: {an UNHANDLED ternary} => still a map node, so the explorer shows it while it awaits a handler', () => {
      const walked = WalkFileResultStub({
        nodes: [WalkNodeStub({ kind: 'ConditionalExpression', startLine: 5, endLine: 5, handled: false })],
      });

      expect(mapProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        nodes: [{ kind: 'ternary', startLine: 5, endLine: 5 }],
      });
    });

    it('EMPTY: {no nodes} => no map nodes', () => {
      expect(mapProjectionTransformer({ walked: WalkFileResultStub({ nodes: [] }) })).toStrictEqual({
        success: true,
        nodes: [],
      });
    });
  });

  describe('the name it carries', () => {
    it('VALID: {a node with no declared name} => the name is omitted rather than emptied', () => {
      const walked = WalkFileResultStub({ nodes: [WalkNodeStub({ kind: 'IfStatement', startLine: 2, endLine: 4 })] });

      expect(mapProjectionTransformer({ walked })).toStrictEqual({
        success: true,
        nodes: [{ kind: 'if', startLine: 2, endLine: 4 }],
      });
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => the positioned error passes straight through', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      expect(mapProjectionTransformer({ walked })).toStrictEqual({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });
    });
  });
});

import { WalkFileResultStub } from '../../contracts/walk-file-result/walk-file-result.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { darkSpotProjectionTransformer } from './dark-spot-projection-transformer';

describe('darkSpotProjectionTransformer', () => {
  describe('the nodes it admits it could not follow', () => {
    it('VALID: {an unhandled node} => a dark spot naming the syntax, its scope, and its span', () => {
      const walked = WalkFileResultStub({
        nodes: [
          WalkNodeStub({
            kind: 'ForOfStatement',
            scopePath: ['*module*', 'sumAll'],
            startLine: 6,
            endLine: 8,
            handled: false,
          }),
        ],
      });

      expect(darkSpotProjectionTransformer({ walked })).toStrictEqual([
        {
          kind: 'ForOfStatement',
          scopePath: ['*module*', 'sumAll'],
          reason: 'unhandled-syntax',
          startLine: 6,
          endLine: 8,
        },
      ]);
    });

    it('VALID: {a handled node} => no dark spot, since the walk claimed it', () => {
      const walked = WalkFileResultStub({
        nodes: [WalkNodeStub({ kind: 'IfStatement', scopePath: ['classify'], startLine: 2, endLine: 4, handled: true })],
      });

      expect(darkSpotProjectionTransformer({ walked })).toStrictEqual([]);
    });

    it('VALID: {handled and unhandled nodes mixed} => only the unhandled ones, in walk order', () => {
      const walked = WalkFileResultStub({
        nodes: [
          WalkNodeStub({ kind: 'IfStatement', scopePath: ['classify'], startLine: 2, endLine: 4, handled: true }),
          WalkNodeStub({
            kind: 'ForOfStatement',
            scopePath: ['*module*', 'sumAll'],
            startLine: 6,
            endLine: 8,
            handled: false,
          }),
          WalkNodeStub({
            kind: 'ConditionalExpression',
            scopePath: ['classify'],
            startLine: 9,
            endLine: 9,
            handled: false,
          }),
        ],
      });

      expect(darkSpotProjectionTransformer({ walked })).toStrictEqual([
        {
          kind: 'ForOfStatement',
          scopePath: ['*module*', 'sumAll'],
          reason: 'unhandled-syntax',
          startLine: 6,
          endLine: 8,
        },
        {
          kind: 'ConditionalExpression',
          scopePath: ['classify'],
          reason: 'unhandled-syntax',
          startLine: 9,
          endLine: 9,
        },
      ]);
    });

    it('EMPTY: {no nodes} => no dark spots', () => {
      expect(darkSpotProjectionTransformer({ walked: WalkFileResultStub({ nodes: [] }) })).toStrictEqual([]);
    });
  });

  describe('a walk that failed', () => {
    it('ERROR: {parse error} => no dark spots, because nothing was walked to be blind to', () => {
      const walked = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      });

      expect(darkSpotProjectionTransformer({ walked })).toStrictEqual([]);
    });
  });
});

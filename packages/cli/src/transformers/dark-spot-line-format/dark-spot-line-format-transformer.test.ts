import { DarkSpotStub } from '@assayer/shared/contracts/dark-spot/dark-spot.stub';

import { darkSpotLineFormatTransformer } from './dark-spot-line-format-transformer';

describe('darkSpotLineFormatTransformer', () => {
  describe('a dark spot', () => {
    it('VALID: {kind: "ForStatement", scopePath: ["sumAll"], L3-L5} => the DARK marker, span, scope, and consequence', () => {
      const result = darkSpotLineFormatTransformer({
        darkSpot: DarkSpotStub({ kind: 'ForStatement', scopePath: ['sumAll'], startLine: 3, endLine: 5 }),
      });

      expect(result).toBe('  DARK ForStatement at L3-L5 in sumAll — Assayer has no handler for it, so nothing inside it is covered');
    });
  });

  describe('a dark spot with a multi-segment scope path', () => {
    it('VALID: {scopePath: ["*module*", "Classifier", "classify"]} => the scope segments joined with slashes', () => {
      const result = darkSpotLineFormatTransformer({
        darkSpot: DarkSpotStub({ scopePath: ['*module*', 'Classifier', 'classify'] }),
      });

      expect(result).toBe(
        '  DARK ForStatement at L3-L5 in *module*/Classifier/classify — Assayer has no handler for it, so nothing inside it is covered',
      );
    });
  });

  describe('a dark spot at module scope', () => {
    it('EMPTY: {scopePath: []} => the scope segment is empty text', () => {
      const result = darkSpotLineFormatTransformer({ darkSpot: DarkSpotStub({ scopePath: [] }) });

      expect(result).toBe('  DARK ForStatement at L3-L5 in  — Assayer has no handler for it, so nothing inside it is covered');
    });
  });
});

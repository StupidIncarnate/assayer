import { darkSpotLineTransformer } from './dark-spot-line-transformer';
import { DarkSpotStub } from '@assayer/shared/contracts';

describe('darkSpotLineTransformer', () => {
  describe('rendering a dark spot', () => {
    it('VALID: {stub dark spot} => names the kind, the span, the scope, and what it costs', () => {
      const result = darkSpotLineTransformer({ darkSpot: DarkSpotStub() });

      expect(String(result)).toBe(
        'DARK ForStatement at L3-L5 in sumAll — Assayer has no handler for it, so nothing inside it is covered',
      );
    });

    // The wording that `assayer unit` prints for the loop specimen, to the byte. The report and the
    // window read one artifact; two wordings would read as two facts.
    it('VALID: {the loop specimen dark spot} => matches the CLI report line exactly', () => {
      const result = darkSpotLineTransformer({
        darkSpot: DarkSpotStub({
          kind: 'ForOfStatement',
          scopePath: ['*module*', 'sumAll'],
          startLine: 4,
          endLine: 6,
        }),
      });

      expect(String(result)).toBe(
        'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it is covered',
      );
    });

    it('VALID: {a nested scope path} => joins the segments with slashes', () => {
      const result = darkSpotLineTransformer({
        darkSpot: DarkSpotStub({ kind: 'TryStatement', scopePath: ['*module*', 'Classifier', 'classify'] }),
      });

      expect(String(result)).toBe(
        'DARK TryStatement at L3-L5 in *module*/Classifier/classify — Assayer has no handler for it, so nothing inside it is covered',
      );
    });

    // A dark spot at the root of the walk belongs to no named scope, and still has to render.
    it('EMPTY: {scopePath: []} => renders with an empty scope rather than throwing', () => {
      const result = darkSpotLineTransformer({ darkSpot: DarkSpotStub({ scopePath: [] }) });

      expect(String(result)).toBe(
        'DARK ForStatement at L3-L5 in  — Assayer has no handler for it, so nothing inside it is covered',
      );
    });

    it('EDGE: {a single-line dark spot} => states the same line at both ends of the span', () => {
      const result = darkSpotLineTransformer({ darkSpot: DarkSpotStub({ startLine: 7, endLine: 7 }) });

      expect(String(result)).toBe(
        'DARK ForStatement at L7-L7 in sumAll — Assayer has no handler for it, so nothing inside it is covered',
      );
    });
  });
});

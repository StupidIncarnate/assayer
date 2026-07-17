import { arrangeTextTransformer } from './arrange-text-transformer';

describe('arrangeTextTransformer', () => {
  describe('param bindings render as arguments', () => {
    it('VALID: {two params} => their values, positionally, comma-separated', () => {
      const result = arrangeTextTransformer({
        arrange: [
          { kind: 'param', param: 'score', value: 6 },
          { kind: 'param', param: 'bonus', value: 2 },
        ],
      } as never);

      expect(result).toBe('6, 2');
    });

    it('VALID: {a string param} => quoted, so an empty string is visible rather than blank', () => {
      const result = arrangeTextTransformer({ arrange: [{ kind: 'param', param: 'name', value: '' }] } as never);

      expect(result).toBe('""');
    });
  });

  describe('env bindings render as the assignment that reproduces them', () => {
    // The line a reader can copy. Rendered positionally — which one shape forced — this printed
    // `*module*("6")`: a call that never happens, an argument nothing accepts, and no mention of the
    // variable that actually decided the arm.
    it('VALID: {an env binding} => NAME="value", naming the variable rather than implying an argument', () => {
      const result = arrangeTextTransformer({ arrange: [{ kind: 'env', name: 'LEVEL', value: '6' }] } as never);

      expect(result).toBe('LEVEL="6"');
    });

    it('VALID: {two env bindings} => both, comma-separated', () => {
      const result = arrangeTextTransformer({
        arrange: [
          { kind: 'env', name: 'PORT', value: '1' },
          { kind: 'env', name: 'RETRIES', value: '2' },
        ],
      } as never);

      expect(result).toBe('PORT="1", RETRIES="2"');
    });
  });

  describe('a case that arranges nothing', () => {
    it('EMPTY: {no bindings} => empty text, since an unguarded exit owes no setup', () => {
      expect(arrangeTextTransformer({ arrange: [] })).toBe('');
    });
  });
});

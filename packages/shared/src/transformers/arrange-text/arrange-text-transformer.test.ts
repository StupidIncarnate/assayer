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

    it('VALID: {an array param} => the array literal a reader would pass, positionally like any argument', () => {
      const result = arrangeTextTransformer({ arrange: [{ kind: 'array', param: 'items', value: [7] }] } as never);

      expect(result).toBe('[7]');
    });

    it('VALID: {a nested array param} => the nested literal renders whole, generic over the nesting', () => {
      const result = arrangeTextTransformer({ arrange: [{ kind: 'array', param: 'matrix', value: [[7]] }] } as never);

      expect(result).toBe('[[7]]');
    });

    it('VALID: {an object param} => the object literal a reader would pass, positionally like any argument', () => {
      const result = arrangeTextTransformer({ arrange: [{ kind: 'object', param: 'config', value: { mode: 'dev' } }] } as never);

      expect(result).toBe('{"mode":"dev"}');
    });

    it('VALID: {a nested object param} => the nested literal renders whole, exactly as a nested array does', () => {
      const result = arrangeTextTransformer({
        arrange: [{ kind: 'object', param: 'config', value: { db: { retry: { backoff: 'linear' } } } }],
      } as never);

      expect(result).toBe('{"db":{"retry":{"backoff":"linear"}}}');
    });

    it('VALID: {an object param beside a scalar} => both, comma-separated, in arrange order', () => {
      const result = arrangeTextTransformer({
        arrange: [
          { kind: 'object', param: 'config', value: { db: { host: 'localhost' }, mode: 'dev' } },
          { kind: 'param', param: 'retries', value: 7 },
        ],
      } as never);

      expect(result).toBe('{"db":{"host":"localhost"},"mode":"dev"}, 7');
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

  describe('harness bindings render as the key that supplied them', () => {
    it('VALID: {a harness binding} => <harness key>, so a supplied input is not read as a derived one', () => {
      const result = arrangeTextTransformer({
        arrange: [{ kind: 'harness', param: 'report', key: 'inputs.audit.report' }],
      } as never);

      expect(result).toBe('<harness inputs.audit.report>');
    });

    it('VALID: {a harness binding beside a derived param} => both, comma-separated, in arrange order', () => {
      const result = arrangeTextTransformer({
        arrange: [
          { kind: 'param', param: 'score', value: 6 },
          { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
        ],
      } as never);

      expect(result).toBe('6, <harness inputs.audit.report>');
    });
  });

  describe('a case that arranges nothing', () => {
    it('EMPTY: {no bindings} => empty text, since an unguarded exit owes no setup', () => {
      expect(arrangeTextTransformer({ arrange: [] })).toBe('');
    });
  });
});

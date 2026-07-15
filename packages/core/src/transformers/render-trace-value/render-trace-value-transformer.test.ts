import { renderTraceValueTransformer } from './render-trace-value-transformer';

describe('renderTraceValueTransformer', () => {
  describe('primitives', () => {
    it("VALID: {value: 'pass'} => quotes the string so it reads as a value, not a label", () => {
      expect(renderTraceValueTransformer({ value: 'pass' })).toBe("'pass'");
    });

    it('VALID: {value: 6} => renders the number', () => {
      expect(renderTraceValueTransformer({ value: 6 })).toBe('6');
    });

    it('VALID: {value: true} => renders the boolean', () => {
      expect(renderTraceValueTransformer({ value: true })).toBe('true');
    });

    it('EMPTY: {value: null} => renders null', () => {
      expect(renderTraceValueTransformer({ value: null })).toBe('null');
    });

    // JSON.stringify(undefined) is undefined, not a string — so undefined needs its own arm or the
    // contract's min-length parse would reject the event.
    it('EMPTY: {value: undefined} => renders undefined rather than an empty string', () => {
      expect(renderTraceValueTransformer({ value: undefined })).toBe('undefined');
    });
  });

  describe('values JSON cannot express', () => {
    it('EDGE: {value: 9007199254740993n} => renders BigInt, which JSON.stringify throws on', () => {
      expect(renderTraceValueTransformer({ value: 9007199254740993n })).toBe('9007199254740993n');
    });

    it('EDGE: {value: a function} => renders a label', () => {
      expect(renderTraceValueTransformer({ value: renderTraceValueTransformer })).toBe('[Function]');
    });

    it('EDGE: {value: a symbol} => renders its description', () => {
      expect(renderTraceValueTransformer({ value: Symbol('tag') })).toBe('Symbol(tag)');
    });
  });

  describe('objects', () => {
    it('VALID: {value: an object} => renders it as JSON', () => {
      expect(renderTraceValueTransformer({ value: { name: 'ada' } })).toBe('{"name":"ada"}');
    });

    // The trace is a display surface: an unrenderable value must degrade, never take the run down.
    it('EDGE: {value: a cyclic value} => degrades to a label instead of throwing', () => {
      const cyclic: unknown[] = [];
      cyclic.push(cyclic);

      expect(renderTraceValueTransformer({ value: cyclic })).toBe('[Unserializable]');
    });
  });
});

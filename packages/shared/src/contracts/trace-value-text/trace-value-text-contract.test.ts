import { traceValueTextContract } from './trace-value-text-contract';
import { TraceValueTextStub } from './trace-value-text.stub';

describe('traceValueTextContract', () => {
  describe('valid renderings', () => {
    it('VALID: {stub default} => parses the quoted string rendering', () => {
      expect(traceValueTextContract.parse(TraceValueTextStub())).toBe("'pass'");
    });

    it('VALID: {a label for an unrenderable value} => parses', () => {
      expect(traceValueTextContract.parse('[Unserializable]')).toBe('[Unserializable]');
    });
  });

  describe('invalid renderings', () => {
    // Empty would mean "we observed something but cannot say what", which reads as no observation at
    // all. `undefined` renders as the word, never as nothing.
    it('EMPTY: {empty string} => throws, since a rendering must say something', () => {
      expect(() => {
        return traceValueTextContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});

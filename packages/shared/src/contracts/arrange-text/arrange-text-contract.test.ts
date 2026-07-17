import { arrangeTextContract } from './arrange-text-contract';
import { ArrangeTextStub } from './arrange-text.stub';

describe('arrangeTextContract', () => {
  describe('valid arrange text', () => {
    it('VALID: {value: \'LEVEL="6"\'} => parses successfully', () => {
      const text = ArrangeTextStub({ value: 'LEVEL="6"' });

      const result = arrangeTextContract.parse(text);

      expect(result).toBe('LEVEL="6"');
    });

    // A case that arranges nothing renders nothing, and that is a real case — an unguarded exit owes
    // no setup. Refusing the empty string would make it unrenderable.
    it('EMPTY: {value: ""} => parses successfully', () => {
      const result = arrangeTextContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid arrange text', () => {
    it('INVALID: {value: 6} => throws validation error', () => {
      expect(() => {
        return arrangeTextContract.parse(6 as never);
      }).toThrow(/Expected string/u);
    });
  });
});

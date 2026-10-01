import { entryLabelContract } from './entry-label-contract';
import { EntryLabelStub } from './entry-label.stub';

describe('entryLabelContract', () => {
  describe('valid entry label', () => {
    it('VALID: {an anonymous callback label} => parses successfully', () => {
      const label = EntryLabelStub({ value: 'rescale › items.map((n) => …) L2' });

      const result = entryLabelContract.parse(label);

      expect(result).toBe('rescale › items.map((n) => …) L2');
    });

    it('VALID: {a module label} => parses successfully, since one shape serves every entry', () => {
      const result = entryLabelContract.parse('uses-console.ts');

      expect(result).toBe('uses-console.ts');
    });
  });

  describe('invalid entry label', () => {
    // Unlike ArrangeText, an empty label is never right: every entry a surface lists has SOMETHING to
    // call it, and a blank row names nothing the reader can act on.
    it('EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        return entryLabelContract.parse('');
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {value: 6} => throws validation error', () => {
      expect(() => {
        return entryLabelContract.parse(6);
      }).toThrow(/Invalid input: expected string, received number/u);
    });
  });
});

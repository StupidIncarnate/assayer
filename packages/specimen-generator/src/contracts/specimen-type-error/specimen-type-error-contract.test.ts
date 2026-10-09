import { specimenTypeErrorContract } from './specimen-type-error-contract';
import { SpecimenTypeErrorStub } from './specimen-type-error.stub';

describe('specimenTypeErrorContract', () => {
  describe('valid errors', () => {
    it('VALID: {stub default} => parses a path and its messages', () => {
      const typeError = SpecimenTypeErrorStub();

      const result = specimenTypeErrorContract.parse(typeError);

      expect(result).toStrictEqual({
        relPath: 'src/if/a/a.ts',
        messages: ["'x' is declared but its value is never read."],
      });
    });
  });

  describe('invalid errors', () => {
    it('INVALID: {relPath: ""} => throws, since an error names its file', () => {
      expect(() => {
        return specimenTypeErrorContract.parse({ ...SpecimenTypeErrorStub(), relPath: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {messages: []} => throws, since a file with an error has a message', () => {
      expect(() => {
        return specimenTypeErrorContract.parse({ ...SpecimenTypeErrorStub(), messages: [] });
      }).toThrow(/Too small: expected array to have >=1 items/u);
    });

    it('INVALID: {messages: missing} => throws, since an error needs messages', () => {
      expect(() => {
        return specimenTypeErrorContract.parse({ relPath: 'a.ts' });
      }).toThrow(/expected array, received undefined/u);
    });
  });
});

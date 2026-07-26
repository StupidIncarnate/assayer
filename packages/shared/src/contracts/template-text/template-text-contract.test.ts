import { templateTextContract } from './template-text-contract';
import { TemplateTextStub } from './template-text.stub';

describe('templateTextContract', () => {
  describe('valid template text', () => {
    it('VALID: {value: "id-"} => parses successfully', () => {
      const text = TemplateTextStub({ value: 'id-' });

      const result = templateTextContract.parse(text);

      expect(result).toBe('id-');
    });

    it('VALID: {value: ""} => parses successfully, because a segment beside the first or last substitution is empty on purpose', () => {
      const result = templateTextContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid template text', () => {
    it('INVALID: {value: 7} => throws validation error', () => {
      expect(() => {
        return templateTextContract.parse(7);
      }).toThrow(/expected string/iu);
    });
  });
});

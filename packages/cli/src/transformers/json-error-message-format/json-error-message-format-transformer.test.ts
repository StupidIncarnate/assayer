import { jsonErrorMessageFormatTransformer } from './json-error-message-format-transformer';

describe('jsonErrorMessageFormatTransformer', () => {
  describe('message reports a position', () => {
    it('VALID: {fileName: "assayer.config.json", message: "Unexpected token } in JSON at position 40", line: 3, column: 12} => returns "assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }"', () => {
      const result = jsonErrorMessageFormatTransformer({
        fileName: 'assayer.config.json',
        message: 'Unexpected token } in JSON at position 40',
        line: 3,
        column: 12,
      });

      expect(result).toBe('assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }');
    });
  });
});

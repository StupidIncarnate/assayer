import { jsonParseErrorSourcePositionTransformer } from './json-parse-error-source-position-transformer';

describe('jsonParseErrorSourcePositionTransformer', () => {
  describe('message reports a position', () => {
    it('VALID: {message: position 16, text: \'{"version": "1",}\'} => returns { line: 1, column: 17 }', () => {
      const result = jsonParseErrorSourcePositionTransformer({
        message: 'Expected double-quoted property name in JSON at position 16 (line 1 column 17)',
        text: '{"version": "1",}',
      });

      expect(result).toStrictEqual({ line: 1, column: 17 });
    });
  });

  describe('message does not report a position', () => {
    it('EDGE: {message: no position, text: \'{"version": }\'} => falls back to offset 0, returns { line: 1, column: 1 }', () => {
      const result = jsonParseErrorSourcePositionTransformer({
        message: 'Unexpected token \'}\', "{"version": }" is not valid JSON',
        text: '{"version": }',
      });

      expect(result).toStrictEqual({ line: 1, column: 1 });
    });
  });
});

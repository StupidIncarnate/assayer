import { jsonParseErrorPositionTransformer } from './json-parse-error-position-transformer';

describe('jsonParseErrorPositionTransformer', () => {
  describe('multi-line text', () => {
    it('VALID: {text: \'{\\n  "a": 1\\n}\', offset: 10} => returns { line: 2, column: 9 }', () => {
      const result = jsonParseErrorPositionTransformer({
        text: '{\n  "a": 1\n}',
        offset: 10,
      });

      expect(result).toStrictEqual({ line: 2, column: 9 });
    });

    it('VALID: {text: \'{\\n  "a": 1,\\n  "b": 2\\n}\', offset: 20} => returns { line: 3, column: 9 }', () => {
      const result = jsonParseErrorPositionTransformer({
        text: '{\n  "a": 1,\n  "b": 2\n}',
        offset: 20,
      });

      expect(result).toStrictEqual({ line: 3, column: 9 });
    });
  });

  describe('offset with no preceding newline', () => {
    it("EDGE: {text: '{}', offset: 0} => returns { line: 1, column: 1 }", () => {
      const result = jsonParseErrorPositionTransformer({ text: '{}', offset: 0 });

      expect(result).toStrictEqual({ line: 1, column: 1 });
    });
  });
});

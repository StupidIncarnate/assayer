import { matrixStatics } from './matrix-statics';

describe('matrixStatics', () => {
  describe('settings', () => {
    it('VALID: {statics} => holds the first committed matrix', () => {
      expect(matrixStatics).toStrictEqual({
        focus: ['if', 'ternary'],
        nesting: {
          depth: 1,
        },
        plainest: ['param', 'env', 'const'],
        typeArguments: ['number', 'boolean'],
        provenances: ['param', 'env', 'literal', 'const', 'external'],
        excludedFills: ['array-at', 'array-includes', 'math-random'],
      });
    });
  });
});

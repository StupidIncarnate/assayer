import { significantSyntaxKindsStatics } from './significant-syntax-kinds-statics';

describe('significantSyntaxKindsStatics', () => {
  describe('kinds', () => {
    it('VALID: {statics} => lists exactly the load-bearing control-flow kinds', () => {
      expect(significantSyntaxKindsStatics).toStrictEqual({
        kinds: [
          'ConditionalExpression',
          'ForStatement',
          'ForInStatement',
          'ForOfStatement',
          'WhileStatement',
          'DoStatement',
          'TryStatement',
        ],
      });
    });

    it('VALID: {kinds} => holds no duplicates, so one node can never yield two dark spots', () => {
      const unique = [...new Set(significantSyntaxKindsStatics.kinds)];

      expect(unique).toStrictEqual([...significantSyntaxKindsStatics.kinds]);
    });
  });
});

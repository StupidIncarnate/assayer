import { mapNodeKindStatics } from './map-node-kind-statics';

describe('mapNodeKindStatics', () => {
  describe('the syntax the map surfaces', () => {
    it('VALID: {pairs} => exactly the four branch constructs, keyed on parser kind names', () => {
      expect(mapNodeKindStatics.pairs).toStrictEqual([
        { syntaxKind: 'FunctionDeclaration', mapKind: 'function' },
        { syntaxKind: 'IfStatement', mapKind: 'if' },
        { syntaxKind: 'ConditionalExpression', mapKind: 'ternary' },
        { syntaxKind: 'SwitchStatement', mapKind: 'switch' },
      ]);
    });
  });

  describe('looking a kind up', () => {
    it('VALID: {IfStatement} => if', () => {
      const pair = mapNodeKindStatics.pairs.find((candidate) => candidate.syntaxKind === 'IfStatement');

      expect({ mapKind: pair?.mapKind }).toStrictEqual({ mapKind: 'if' });
    });

    it('VALID: {ConditionalExpression} => ternary', () => {
      const pair = mapNodeKindStatics.pairs.find((candidate) => candidate.syntaxKind === 'ConditionalExpression');

      expect({ mapKind: pair?.mapKind }).toStrictEqual({ mapKind: 'ternary' });
    });

    it('VALID: {FunctionDeclaration} => function', () => {
      const pair = mapNodeKindStatics.pairs.find((candidate) => candidate.syntaxKind === 'FunctionDeclaration');

      expect({ mapKind: pair?.mapKind }).toStrictEqual({ mapKind: 'function' });
    });

    it('VALID: {SwitchStatement} => switch', () => {
      const pair = mapNodeKindStatics.pairs.find((candidate) => candidate.syntaxKind === 'SwitchStatement');

      expect({ mapKind: pair?.mapKind }).toStrictEqual({ mapKind: 'switch' });
    });
  });
});

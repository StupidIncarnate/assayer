import { Node, Project } from '#gateway/npm/ts-morph';

import { isCalledInPlaceGuard } from './is-called-in-place-guard';

const arrowOf = ({ source }: { source: string }): Node => {
  const file = new Project({ useInMemoryFileSystem: true }).createSourceFile('a.ts', source);

  return file.getVariableDeclarationOrThrow('target').getInitializerOrThrow();
};

describe('isCalledInPlaceGuard', () => {
  describe('called where it is written', () => {
    it('VALID: {an arrow called at once} => true', () => {
      const node = arrowOf({ source: 'const target = (() => 1)();\n' }).getFirstDescendantOrThrow((d) => Node.isArrowFunction(d));

      expect(isCalledInPlaceGuard({ node })).toBe(true);
    });

    it('VALID: {a function expression in two pairs of parentheses, called} => true', () => {
      const node = arrowOf({ source: 'const target = ((function () { return 1; }))();\n' }).getFirstDescendantOrThrow((d) =>
        Node.isFunctionExpression(d),
      );

      expect(isCalledInPlaceGuard({ node })).toBe(true);
    });
  });

  describe('not called where it is written', () => {
    it('VALID: {an arrow stored in a variable} => false', () => {
      expect(isCalledInPlaceGuard({ node: arrowOf({ source: 'const target = () => 1;\n' }) })).toBe(false);
    });

    it('VALID: {an arrow passed as an argument} => false', () => {
      const node = arrowOf({ source: 'const target = run(() => 1);\n' }).getFirstDescendantOrThrow((d) => Node.isArrowFunction(d));

      expect(isCalledInPlaceGuard({ node })).toBe(false);
    });

    it('EDGE: {the source file itself, which has no parent} => false', () => {
      const file = new Project({ useInMemoryFileSystem: true }).createSourceFile('b.ts', 'export {};\n');

      expect(isCalledInPlaceGuard({ node: file })).toBe(false);
    });
  });
});

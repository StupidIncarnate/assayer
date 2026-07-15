import { Project, SyntaxKind } from 'ts-morph';

import { projectNodeLayerAdapter } from './project-node-layer-adapter';
import { projectNodeLayerAdapterProxy } from './project-node-layer-adapter.proxy';

describe('projectNodeLayerAdapter', () => {
  describe('condition projections', () => {
    it('VALID: {name.length === 0} => kinds plus symbol names plus literal values', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (name.length === 0) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      expect(projectNodeLayerAdapter({ node })).toBe(
        'BinaryExpression,PropertyAccessExpression,id:name,id:length,EqualsEqualsEqualsToken,num:0',
      );
    });

    it('VALID: {value > 5} => the operator token survives, because the operator IS the logic', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      expect(projectNodeLayerAdapter({ node })).toBe('BinaryExpression,id:value,GreaterThanToken,num:5');
    });

    it('VALID: {bare identifier discriminant} => a single symbol token', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/g.ts', 'switch (method) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Identifier);

      expect(projectNodeLayerAdapter({ node })).toBe('id:method');
    });
  });

  describe('formatting invariance', () => {
    it('VALID: {double-quoted and spaced} => same projection as single-quoted and tight', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const spaced = project.createSourceFile('src/a.ts', 'if (something === "blah") {}\n');
      const tight = project.createSourceFile('src/b.ts', "if (something==='blah') {}\n");
      const spacedNode = spaced.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);
      const tightNode = tight.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      expect(projectNodeLayerAdapter({ node: spacedNode })).toBe(
        'BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah',
      );
      expect(projectNodeLayerAdapter({ node: tightNode })).toBe(
        'BinaryExpression,id:something,EqualsEqualsEqualsToken,str:blah',
      );
    });

    it('VALID: {redundant parens} => collapse to what they wrap', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const parenthesized = project.createSourceFile('src/a.ts', 'if ((value) > 5) {}\n');
      const node = parenthesized.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      expect(projectNodeLayerAdapter({ node })).toBe('BinaryExpression,id:value,GreaterThanToken,num:5');
    });

    it('VALID: {optional arrow parens} => do NOT move identity, since they are spelling not logic', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const withParens = project.createSourceFile('src/a.ts', 'const a = (n) => n;\n');
      const without = project.createSourceFile('src/b.ts', 'const a = n => n;\n');
      const withNode = withParens.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);
      const withoutNode = without.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(projectNodeLayerAdapter({ node: withNode })).toBe(
        'ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n',
      );
      expect(projectNodeLayerAdapter({ node: withoutNode })).toBe(
        'ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n',
      );
    });
  });

  describe('logic changes', () => {
    it('VALID: {operator changed} => projection changes, because the logic changed', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/a.ts', 'if (value >= 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      expect(projectNodeLayerAdapter({ node })).toBe('BinaryExpression,id:value,GreaterThanEqualsToken,num:5');
    });

    it('VALID: {literal value changed} => projection changes, because the logic changed', () => {
      projectNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/a.ts', 'if (value > 6) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      expect(projectNodeLayerAdapter({ node })).toBe('BinaryExpression,id:value,GreaterThanToken,num:6');
    });
  });
});

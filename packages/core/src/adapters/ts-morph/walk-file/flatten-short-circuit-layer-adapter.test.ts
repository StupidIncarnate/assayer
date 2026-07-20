import { Project, SyntaxKind } from 'ts-morph';

import { flattenShortCircuitLayerAdapter } from './flatten-short-circuit-layer-adapter';
import { flattenShortCircuitLayerAdapterProxy } from './flatten-short-circuit-layer-adapter.proxy';

describe('flattenShortCircuitLayerAdapter', () => {
  describe('a same-operator spine', () => {
    it('VALID: {`a || b || c`} => three operands in source order', () => {
      flattenShortCircuitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return a || b || c;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerAdapter({ expression, operator: SyntaxKind.BarBarToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b', 'c']);
    });

    it('VALID: {`a && b && c && d`} => four operands in source order', () => {
      flattenShortCircuitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return a && b && c && d;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerAdapter({ expression, operator: SyntaxKind.AmpersandAmpersandToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('parentheses on the spine are formatting', () => {
    it('VALID: {`(a || b) || c`} => flattens identically to `a || b || c`', () => {
      flattenShortCircuitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return (a || b) || c;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerAdapter({ expression, operator: SyntaxKind.BarBarToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b', 'c']);
    });
  });

  describe('a different operator ends the spine', () => {
    it('VALID: {`a || b && c`} => the tighter `&&` stays one operand', () => {
      flattenShortCircuitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return a || b && c;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerAdapter({ expression, operator: SyntaxKind.BarBarToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b && c']);
    });
  });
});

import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { flattenShortCircuitLayerTransformer } from './flatten-short-circuit-layer-transformer';
import { flattenShortCircuitLayerTransformerProxy } from './flatten-short-circuit-layer-transformer.proxy';

describe('flattenShortCircuitLayerTransformer', () => {
  describe('a same-operator spine', () => {
    it('VALID: {`a || b || c`} => three operands in source order', () => {
      flattenShortCircuitLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return a || b || c;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerTransformer({ expression, operator: SyntaxKind.BarBarToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b', 'c']);
    });

    it('VALID: {`a && b && c && d`} => four operands in source order', () => {
      flattenShortCircuitLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return a && b && c && d;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerTransformer({ expression, operator: SyntaxKind.AmpersandAmpersandToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('parentheses on the spine are formatting', () => {
    it('VALID: {`(a || b) || c`} => flattens identically to `a || b || c`', () => {
      flattenShortCircuitLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return (a || b) || c;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerTransformer({ expression, operator: SyntaxKind.BarBarToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b', 'c']);
    });
  });

  describe('a different operator ends the spine', () => {
    it('VALID: {`a || b && c`} => the tighter `&&` stays one operand', () => {
      flattenShortCircuitLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f() {\n  return a || b && c;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const operands = flattenShortCircuitLayerTransformer({ expression, operator: SyntaxKind.BarBarToken });

      expect(operands.map((operand) => operand.getText())).toStrictEqual(['a', 'b && c']);
    });
  });
});

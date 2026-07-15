import { Project, SyntaxKind } from 'ts-morph';

import { readConditionLayerAdapter } from './read-condition-layer-adapter';
import { readConditionLayerAdapterProxy } from './read-condition-layer-adapter.proxy';

describe('readConditionLayerAdapter', () => {
  describe('the operand it reads', () => {
    it('VALID: {name.length === 0} => the operand is name itself, not the .length access', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (name.length === 0) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({ kind: result.operandNode.getKindName(), name: result.operandName }).toStrictEqual({
        kind: 'Identifier',
        name: 'name',
      });
    });

    it('VALID: {value > 5} => the left-hand identifier is the operand', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({ kind: result.operandNode.getKindName(), name: result.operandName }).toStrictEqual({
        kind: 'Identifier',
        name: 'value',
      });
    });

    it('EDGE: {a.b > c} => the operand is the property access and it contributes NO name', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (a.b > c) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({ kind: result.operandNode.getKindName(), name: result.operandName }).toStrictEqual({
        kind: 'PropertyAccessExpression',
        name: undefined,
      });
    });

    it('EDGE: {bare identifier condition} => the whole expression is the operand', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (flag) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({ kind: result.operandNode.getKindName(), name: result.operandName }).toStrictEqual({
        kind: 'Identifier',
        name: 'flag',
      });
    });
  });

  describe('the predicate it parses', () => {
    it('VALID: {name.length === 0} => a length-eq-zero predicate', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (name.length === 0) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'length-eq-zero' });
    });

    it('VALID: {value > 5} => a gt predicate carrying the literal VALUE', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'gt', literal: 5 });
    });

    it("VALID: {method === 'get'} => an eq predicate carrying the unquoted string value", () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "if (method === 'get') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'eq', literal: 'get' });
    });

    it('VALID: {n === 3} => an eq predicate carrying the numeric value', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (n === 3) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'eq', literal: 3 });
    });

    it('VALID: {flag === true} => an eq predicate on the boolean keyword', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (flag === true) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'eq', literal: true });
    });

    it('VALID: {flag === false} => an eq predicate on the boolean keyword', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (flag === false) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'eq', literal: false });
    });
  });

  describe('conditions it cannot classify', () => {
    it('EDGE: {bare identifier condition} => an unrecognized predicate rather than a guess', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (flag) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'unrecognized' });
    });

    it('EDGE: {a.b > c compared against a non-literal} => an unrecognized predicate', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (a.b > c) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'unrecognized' });
    });
  });

  describe('formatting invariance', () => {
    it('VALID: {double-quoted vs single-quoted literal} => the same parsed literal VALUE', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const doubled = project.createSourceFile('src/a.ts', 'if (method === "get") {}\n');
      const singled = project.createSourceFile('src/b.ts', "if (method==='get') {}\n");
      const doubledCondition = doubled.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const singledCondition = singled.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition: doubledCondition }).predicate).toStrictEqual({
        kind: 'eq',
        literal: 'get',
      });
      expect(readConditionLayerAdapter({ condition: singledCondition }).predicate).toStrictEqual({
        kind: 'eq',
        literal: 'get',
      });
    });
  });
});

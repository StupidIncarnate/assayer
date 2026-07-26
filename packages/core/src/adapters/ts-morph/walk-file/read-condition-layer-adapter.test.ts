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

  describe('object-member operands', () => {
    it('VALID: {config.mode === "a"} => records the root param, property path, and root type-reference', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode: string }\nexport function decide(config: Config): string {\n  if (config.mode === "a") { return "x"; }\n  return "y";\n}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({
        operandName: result.operandName,
        operandRootName: result.operandRootName,
        operandPropertyPath: result.operandPropertyPath,
        operandTypeRef: result.operandTypeRef,
      }).toStrictEqual({
        operandName: undefined,
        operandRootName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
      });
    });

    it('EDGE: {a.b > c on an undeclared root} => the property path is read but no type-reference resolves', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (a.b > c) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({
        operandRootName: result.operandRootName,
        operandPropertyPath: result.operandPropertyPath,
        operandTypeRef: result.operandTypeRef,
      }).toStrictEqual({
        operandRootName: 'a',
        operandPropertyPath: ['b'],
        operandTypeRef: undefined,
      });
    });
  });

  describe('typeof operand', () => {
    it("VALID: {typeof target === 'string'} => the operand is target itself, past the typeof keyword, and it is marked operandIsTypeof", () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "if (typeof target === 'string') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({
        kind: result.operandNode.getKindName(),
        name: result.operandName,
        operandIsTypeof: result.operandIsTypeof,
      }).toStrictEqual({
        kind: 'Identifier',
        name: 'target',
        operandIsTypeof: true,
      });
    });

    it("VALID: {typeof config.mode === 'string'} => typeof unwraps to the property access, which still decomposes into its root and path", () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "if (typeof config.mode === 'string') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionLayerAdapter({ condition });

      expect({
        kind: result.operandNode.getKindName(),
        operandRootName: result.operandRootName,
        operandPropertyPath: result.operandPropertyPath,
        operandIsTypeof: result.operandIsTypeof,
      }).toStrictEqual({
        kind: 'PropertyAccessExpression',
        operandRootName: 'config',
        operandPropertyPath: ['mode'],
        operandIsTypeof: true,
      });
    });
  });

  describe('the predicate it parses', () => {
    it('VALID: {name.length === 0} => a length-eq predicate carrying the threshold', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (name.length === 0) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'length-eq', literal: 0 });
    });

    // The right-hand literal is read whether or not the left side is `.length`. Suppressing it there
    // left every length comparison but the two against zero with no threshold to classify, so they all
    // came back `unrecognized` and constrained nothing.
    it('VALID: {name.length >= 2} => a length-gte predicate carrying the non-zero threshold', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (name.length >= 2) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'length-gte', literal: 2 });
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

    // `null` is a KEYWORD node (`NullKeyword`), read the same way as `TrueKeyword`/`FalseKeyword` — not
    // an Identifier, so it never reaches `operandName`. Before this reader knew `NullKeyword`, the right
    // side stayed unread and the predicate came back `unrecognized` for every `=== null` comparison.
    it('VALID: {v === null} => an eq predicate carrying the literal null', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (v === null) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'eq', literal: null });
    });

    it('VALID: {v !== null} => a neq predicate carrying the literal null', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (v !== null) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'neq', literal: null });
    });

    // `undefined` is NOT a keyword — it is an IDENTIFIER referencing the global binding — so it stays
    // unread exactly as before: `RepresentativeValue` has no `undefined` member, so there is no literal
    // to carry even once the identifier is recognized as meaning "no value".
    it('VALID: {v === undefined} => an unrecognized predicate, since undefined is an Identifier, not a keyword', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (v === undefined) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'unrecognized' });
    });

    it("VALID: {typeof target === 'string'} => a typeof-eq predicate carrying the tag", () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "if (typeof target === 'string') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'typeof-eq', literal: 'string' });
    });

    it("VALID: {typeof target !== 'string'} => a typeof-neq predicate carrying the tag", () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', "if (typeof target !== 'string') {}\n");
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'typeof-neq', literal: 'string' });
    });

    // `typeof` never produces a number, so a numeric right-hand side names no real tag — unrecognized,
    // never read as though the number were a valid typeof result.
    it('EDGE: {typeof target === 3} => unrecognized, since a typeof tag must be a string', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (typeof target === 3) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'unrecognized' });
    });
  });

  describe('conditions with no comparison at all', () => {
    // Not a guess: a condition with no operator IS a truthiness test, which is what the language
    // does. Reading it as `unrecognized` meant a bare boolean operand had no derivable domain, so
    // `if (a || flag)` and `if (!ready)` produced no usable values.
    it('VALID: {bare identifier condition} => a truthy predicate on the operand itself', () => {
      readConditionLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (flag) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      expect(readConditionLayerAdapter({ condition }).predicate).toStrictEqual({ kind: 'truthy' });
    });
  });

  describe('conditions it cannot classify', () => {
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

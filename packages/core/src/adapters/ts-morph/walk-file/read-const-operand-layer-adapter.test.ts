import { Node, Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { readConstOperandLayerAdapter } from './read-const-operand-layer-adapter';
import { readConstOperandLayerAdapterProxy } from './read-const-operand-layer-adapter.proxy';

// The operand identifier of the file's `if`, extracted exactly as `read-condition` extracts it: the
// left side, unwrapped past a `.length` access so `items.length > 2` reads its operand as `items`.
const operandOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('src/x.ts', source);
  const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
  const left = Node.isBinaryExpression(condition) ? condition.getLeft() : condition;

  return Node.isPropertyAccessExpression(left) && left.getName() === 'length' ? left.getExpression() : left;
};

describe('readConstOperandLayerAdapter', () => {
  describe('a same-file const welded to a literal', () => {
    it('VALID: {const level = 7} => the welded scalar value', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({ node: operandOf({ source: 'const level = 7;\nif (level > 5) {} else {}' }) });

      expect(result).toStrictEqual({ value: 7 });
    });

    it("VALID: {const mode = 'a'} => the welded string value", () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({ node: operandOf({ source: "const mode = 'a';\nif (mode === 'a') {} else {}" }) });

      expect(result).toStrictEqual({ value: 'a' });
    });

    it('VALID: {const flag = true} => the welded boolean value', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({ node: operandOf({ source: 'const flag = true;\nif (flag) {} else {}' }) });

      expect(result).toStrictEqual({ value: true });
    });
  });

  describe('a same-file const array welds its length', () => {
    it('VALID: {const items = [1, 2, 3]} => the welded array length', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({
        node: operandOf({ source: 'const items = [1, 2, 3];\nif (items.length > 2) {} else {}' }),
      });

      expect(result).toStrictEqual({ length: 3 });
    });

    it('EMPTY: {const items = []} => a welded length of zero', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({ node: operandOf({ source: 'const items = [];\nif (items.length > 0) {} else {}' }) });

      expect(result).toStrictEqual({ length: 0 });
    });
  });

  describe('not a welded literal — honestly nothing', () => {
    it('VALID: {a reassignable let} => nothing, since its value is not welded', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({ node: operandOf({ source: 'let level = 7;\nif (level > 5) {} else {}' }) });

      expect(result).toBe(undefined);
    });

    it('VALID: {a computed initializer} => nothing, since the analyzer folds no arithmetic', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({ node: operandOf({ source: 'const level = 5 + 2;\nif (level > 5) {} else {}' }) });

      expect(result).toBe(undefined);
    });

    it('VALID: {an env read} => nothing, since its initializer is a call, not a literal', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({
        node: operandOf({ source: 'const value = Number(process.env.V);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a function param} => nothing, since it resolves to a ParameterDeclaration', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({
        node: operandOf({ source: 'export function f(value: number): string {\n  if (value > 5) { return "b"; }\n  return "s";\n}' }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {an operand that is not an identifier} => nothing', () => {
      readConstOperandLayerAdapterProxy();

      const result = readConstOperandLayerAdapter({
        node: operandOf({ source: 'export function f(s: string): void {\n  if (s.length > 5) { console.log(1); }\n}' }),
      });

      expect(result).toBe(undefined);
    });
  });
});

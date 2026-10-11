import { Node, Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readValueExprLayerTransformer } from './read-value-expr-layer-transformer';
import { readValueExprLayerTransformerProxy } from './read-value-expr-layer-transformer.proxy';

// The initializer of the variable the source calls `target`, read with the given parameters in reach.
const readTarget = ({ source, params = ['n'] }: { source: string; params?: string[] }): ReturnType<typeof readValueExprLayerTransformer> => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);
  const declaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration).find((candidate) => candidate.getName() === 'target');
  const initializer = declaration?.getInitializer();

  if (initializer === undefined || !Node.isExpression(initializer)) {
    throw new Error('no `target` initializer');
  }

  return readValueExprLayerTransformer({ node: initializer, scopePath: ['f'], paramNames: new Set(params), bindings: {} });
};

describe('readValueExprLayerTransformer', () => {
  describe('literals and parameters', () => {
    it('VALID: {a string literal} => that literal', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: "function f(n: string) { const target = 'NoneTon'; }" })).toStrictEqual({ kind: 'lit', value: 'NoneTon' });
    });

    it('VALID: {a negative number} => the negative literal', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: 'function f(n: number) { const target = -1; }' })).toStrictEqual({ kind: 'lit', value: -1 });
    });

    it('VALID: {a parameter of the scope} => that parameter', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: 'function f(n: string) { const target = n; }' })).toStrictEqual({ kind: 'param', name: 'n' });
    });

    it('EMPTY: {a parameter written outside the walk` reach} => not an expression', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: 'function f(n: number) { for (let i = 0; i < 2; i += 1) { n = i; } const target = n; }' })).toBe(undefined);
    });

    it('EMPTY: {an identifier that is neither a parameter nor tracked} => not an expression', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: 'declare const other: string;\nfunction f(n: string) { const target = other; }' })).toBe(undefined);
    });
  });

  describe('a ternary', () => {
    it('VALID: {n.length < 5 ? n : "NoneTon"} => a select on that ternary`s branch', () => {
      readValueExprLayerTransformerProxy();

      const result = readTarget({ source: "function f(n: string) { const target = n.length < 5 ? n : 'NoneTon'; }" });

      expect(result).toStrictEqual({
        kind: 'select',
        branch: 'f/ternary:BinaryExpression,PropertyAccessExpression,id:n,id:length,LessThanToken,num:5',
        then: { kind: 'param', name: 'n' },
        else: { kind: 'lit', value: 'NoneTon' },
      });
    });
  });

  describe('string methods', () => {
    it('VALID: {n.slice(1, -1)} => the method over the parameter', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: 'function f(n: string) { const target = n.slice(1, -1); }' })).toStrictEqual({
        kind: 'method',
        name: 'slice',
        receiver: { kind: 'param', name: 'n' },
        args: [
          { kind: 'lit', value: 1 },
          { kind: 'lit', value: -1 },
        ],
      });
    });

    it('EMPTY: {a method the engine cannot evaluate} => not an expression', () => {
      readValueExprLayerTransformerProxy();

      expect(readTarget({ source: "function f(n: string) { const target = n.split(','); }" })).toBe(undefined);
    });
  });

  describe('a call to a function in the same file', () => {
    it('VALID: {a const arrow whose body is one expression} => that expression with the argument in place of the parameter', () => {
      readValueExprLayerTransformerProxy();
      const source = 'const trim = (text: string): string => text.slice(1, -1);\nfunction f(n: string) { const target = trim(n); }';

      expect(readTarget({ source })).toStrictEqual({
        kind: 'method',
        name: 'slice',
        receiver: { kind: 'param', name: 'n' },
        args: [
          { kind: 'lit', value: 1 },
          { kind: 'lit', value: -1 },
        ],
      });
    });

    it('VALID: {a function declaration whose body is one return} => the returned expression', () => {
      readValueExprLayerTransformerProxy();
      const source = 'function upper(text: string): string { return text.toUpperCase(); }\nfunction f(n: string) { const target = upper(n); }';

      expect(readTarget({ source })).toStrictEqual({ kind: 'method', name: 'toUpperCase', receiver: { kind: 'param', name: 'n' }, args: [] });
    });

    it('EMPTY: {a callee with more than a return} => not an expression', () => {
      readValueExprLayerTransformerProxy();
      const source = 'function noisy(text: string): string { console.log(text); return text; }\nfunction f(n: string) { const target = noisy(n); }';

      expect(readTarget({ source })).toBe(undefined);
    });

    it('EMPTY: {an imported callee} => not an expression', () => {
      readValueExprLayerTransformerProxy();
      const source = "import { trim } from './trim';\nfunction f(n: string) { const target = trim(n); }";

      expect(readTarget({ source })).toBe(undefined);
    });

    it('EMPTY: {a callee that reaches itself} => not an expression, since following ends at a depth', () => {
      readValueExprLayerTransformerProxy();
      const source = 'function loop(text: string): string { return loop(text); }\nfunction f(n: string) { const target = loop(n); }';

      expect(readTarget({ source })).toBe(undefined);
    });
  });
});

import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readParameterDefaultsLayerTransformer } from './read-parameter-defaults-layer-transformer';
import { readParameterDefaultsLayerTransformerProxy } from './read-parameter-defaults-layer-transformer.proxy';

describe('readParameterDefaultsLayerTransformer', () => {
  describe('a plain parameter', () => {
    it('VALID: {n = 1} => the parameter\'s own default', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number = 1): number {\n  return n;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result.map((initializer) => initializer.getKindName())).toStrictEqual(['NumericLiteral']);
    });

    it('EMPTY: {n: number} => no default', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number): number {\n  return n;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a destructured parameter', () => {
    it('VALID: {{ a = 1, b = "x" }} => the default of each element, in source order', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function f({ a = 1, b = 'x' }: { a?: number; b?: string }): number {\n  return a;\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result.map((initializer) => initializer.getKindName())).toStrictEqual(['NumericLiteral', 'StringLiteral']);
    });

    it('VALID: {[a = 1, b = "x"]} => the default of each array element, in source order', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function f([a = 1, b = 'x']: [number?, string?]): number {\n  return a;\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result.map((initializer) => initializer.getKindName())).toStrictEqual(['NumericLiteral', 'StringLiteral']);
    });

    it('VALID: {{ a: { b = 1 } = {} } = {}} => the parameter default, then the element default, then the nested one', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function f({ a: { b = 1 } = {} }: { a?: { b?: number } } = {}): number {\n  return b;\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result.map((initializer) => initializer.getKindName())).toStrictEqual([
        'ObjectLiteralExpression',
        'ObjectLiteralExpression',
        'NumericLiteral',
      ]);
    });

    it('EMPTY: {{ a }} => a pattern whose elements have no default reads none', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f({ a }: { a: number }): number {\n  return a;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a node that is not a parameter', () => {
    it('EMPTY: {a function declaration} => nothing', () => {
      readParameterDefaultsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number = 1): number {\n  return n;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = readParameterDefaultsLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });
});

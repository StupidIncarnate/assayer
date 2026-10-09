import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readInstanceInitializersLayerTransformer } from './read-instance-initializers-layer-transformer';
import { readInstanceInitializersLayerTransformerProxy } from './read-instance-initializers-layer-transformer.proxy';

describe('readInstanceInitializersLayerTransformer', () => {
  describe('instance fields', () => {
    it('VALID: {two initialized instance fields} => both initializers, in source order', () => {
      readInstanceInitializersLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export class Labeller {\n  first = 'a';\n  second = 2;\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = readInstanceInitializersLayerTransformer({ node });

      expect(result.map((initializer) => ({ kind: initializer.getKindName(), line: initializer.getStartLineNumber() }))).toStrictEqual([
        { kind: 'StringLiteral', line: 2 },
        { kind: 'NumericLiteral', line: 3 },
      ]);
    });

    it('VALID: {a class expression} => reads its instance fields the same way', () => {
      readInstanceInitializersLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "export const Labeller = class {\n  label = 'a';\n};\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassExpression);

      const result = readInstanceInitializersLayerTransformer({ node });

      expect(result.map((initializer) => initializer.getKindName())).toStrictEqual(['StringLiteral']);
    });
  });

  describe('what it leaves out', () => {
    it('EMPTY: {a static field, an uninitialized field, a method} => nothing, since none runs at construction', () => {
      readInstanceInitializersLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export class Labeller {\n  static shared = 'a';\n  label?: string;\n  read(): string {\n    return 'b';\n  }\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = readInstanceInitializersLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a node that is not a class', () => {
    it('EMPTY: {a function declaration} => nothing, since only a class has instance fields', () => {
      readInstanceInitializersLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "export function label(): string {\n  return 'a';\n}\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = readInstanceInitializersLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });
});

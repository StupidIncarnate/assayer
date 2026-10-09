import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readDecoratorsLayerTransformer } from './read-decorators-layer-transformer';
import { readDecoratorsLayerTransformerProxy } from './read-decorators-layer-transformer.proxy';

describe('readDecoratorsLayerTransformer', () => {
  describe('decorators a class carries', () => {
    it('VALID: {a decorated class, method, field and parameter} => every decorator, in source order', () => {
      readDecoratorsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        [
          'declare function d(n: number): any;',
          '@d(1)',
          'export class X {',
          '  @d(2)',
          '  label = 0;',
          '  @d(3)',
          '  m(@d(4) x: number): void {}',
          '}',
          '',
        ].join('\n'),
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = readDecoratorsLayerTransformer({ node });

      expect(result.map((decorator) => ({ kind: decorator.getKindName(), line: decorator.getStartLineNumber() }))).toStrictEqual([
        { kind: 'Decorator', line: 2 },
        { kind: 'Decorator', line: 4 },
        { kind: 'Decorator', line: 6 },
        { kind: 'Decorator', line: 7 },
      ]);
    });

    it('VALID: {a decorated constructor parameter} => its decorator', () => {
      readDecoratorsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function d(n: number): any;\nexport class X {\n  constructor(@d(1) public x: number) {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = readDecoratorsLayerTransformer({ node });

      expect(result.map((decorator) => decorator.getStartLineNumber())).toStrictEqual([3]);
    });

    it('EMPTY: {a class with no decorators} => nothing', () => {
      readDecoratorsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class X {\n  m(x: number): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = readDecoratorsLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a node that is not a class', () => {
    it('EMPTY: {a function declaration} => nothing', () => {
      readDecoratorsLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(n: number): number {\n  return n;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      const result = readDecoratorsLayerTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });
});

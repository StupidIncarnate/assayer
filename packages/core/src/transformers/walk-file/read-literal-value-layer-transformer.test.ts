import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readLiteralValueLayerTransformer } from './read-literal-value-layer-transformer';
import { readLiteralValueLayerTransformerProxy } from './read-literal-value-layer-transformer.proxy';

describe('readLiteralValueLayerTransformer', () => {
  describe('literals', () => {
    it("VALID: {`'yes'`} => 'yes'", () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "const v = 'yes';\n");
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe('yes');
    });

    it('VALID: {`"yes"`, double quotes} => the same value a single-quoted literal reads as', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = "yes";\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe('yes');
    });

    it('VALID: {`0x10`} => 16, the value rather than the spelling', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = 0x10;\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe(16);
    });

    it('VALID: {`true`} => true', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = true;\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe(true);
    });

    it('VALID: {`false`} => false', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = false;\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe(false);
    });

    it('VALID: {`null`} => null', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = null;\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe(null);
    });

    it('VALID: {`((0))`, redundant parentheses} => 0, the parentheses seen through', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = ((0));\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe(0);
    });
  });

  describe('non-literals', () => {
    it('EMPTY: {`undefined`, an identifier} => undefined', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = undefined;\n');
      const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

      expect(readLiteralValueLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {`-1`, a prefix expression} => undefined', () => {
      readLiteralValueLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const v = -1;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PrefixUnaryExpression);

      expect(readLiteralValueLayerTransformer({ node })).toBe(undefined);
    });
  });
});

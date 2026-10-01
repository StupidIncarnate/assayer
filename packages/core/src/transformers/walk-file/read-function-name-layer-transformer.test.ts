import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { readFunctionNameLayerTransformer } from './read-function-name-layer-transformer';
import { readFunctionNameLayerTransformerProxy } from './read-function-name-layer-transformer.proxy';

describe('readFunctionNameLayerAdapter', () => {
  describe('names carried by the declaration', () => {
    it('VALID: {function declaration} => its own name', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({ name: 'classify', anonymous: false });
    });

    it('VALID: {class method} => its own name', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  classify(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({ name: 'classify', anonymous: false });
    });

    it('VALID: {constructor} => `constructor`', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  constructor() {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({ name: 'constructor', anonymous: false });
    });
  });

  describe('names borrowed from the binding', () => {
    it('VALID: {arrow assigned to a const} => the const name', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const classify = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({ name: 'classify', anonymous: false });
    });

    it('VALID: {arrow assigned to a class property} => the property name', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  handleClick = (): void => {};\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({ name: 'handleClick', anonymous: false });
    });

    it('VALID: {default-exported arrow} => `default`', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({ name: 'default', anonymous: false });
    });
  });

  describe('anonymous functions', () => {
    // The projection is the IDENTITY and `anonymous` is the warning that comes with it: it is a key,
    // so a surface owes this scope a label built some other way.
    it('VALID: {bare callback} => its STRUCTURAL projection, flagged anonymous', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const xs: number[];\nxs.map((n) => n);\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerTransformer({ node })).toStrictEqual({
        name: 'fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n',
        anonymous: true,
      });
    });

    it('VALID: {callback moved to another line} => keeps the SAME name, because position is not identity', () => {
      readFunctionNameLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const first = project.createSourceFile('src/a.ts', 'declare const xs: number[];\nxs.map((n) => n);\n');
      const moved = project.createSourceFile('src/b.ts', 'declare const xs: number[];\n\n\n\nxs.map((n) => n);\n');
      const firstNode = first.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);
      const movedNode = moved.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerTransformer({ node: firstNode })).toStrictEqual(
        readFunctionNameLayerTransformer({ node: movedNode }),
      );
    });
  });
});

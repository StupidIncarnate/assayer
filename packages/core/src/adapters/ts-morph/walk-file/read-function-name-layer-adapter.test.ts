import { Project, SyntaxKind } from 'ts-morph';

import { readFunctionNameLayerAdapter } from './read-function-name-layer-adapter';
import { readFunctionNameLayerAdapterProxy } from './read-function-name-layer-adapter.proxy';

describe('readFunctionNameLayerAdapter', () => {
  describe('names carried by the declaration', () => {
    it('VALID: {function declaration} => its own name', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readFunctionNameLayerAdapter({ node })).toBe('classify');
    });

    it('VALID: {class method} => its own name', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  classify(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readFunctionNameLayerAdapter({ node })).toBe('classify');
    });

    it('VALID: {constructor} => `constructor`', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  constructor() {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);

      expect(readFunctionNameLayerAdapter({ node })).toBe('constructor');
    });
  });

  describe('names borrowed from the binding', () => {
    it('VALID: {arrow assigned to a const} => the const name', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const classify = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerAdapter({ node })).toBe('classify');
    });

    it('VALID: {arrow assigned to a class property} => the property name', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  handleClick = (): void => {};\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerAdapter({ node })).toBe('handleClick');
    });

    it('VALID: {default-exported arrow} => `default`', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerAdapter({ node })).toBe('default');
    });
  });

  describe('anonymous functions', () => {
    it('VALID: {bare callback} => its STRUCTURAL projection, so the name carries no position', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const xs: number[];\nxs.map((n) => n);\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerAdapter({ node })).toBe('fn:ArrowFunction,Parameter,id:n,EqualsGreaterThanToken,id:n');
    });

    it('VALID: {callback moved to another line} => keeps the SAME name, because position is not identity', () => {
      readFunctionNameLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const first = project.createSourceFile('src/a.ts', 'declare const xs: number[];\nxs.map((n) => n);\n');
      const moved = project.createSourceFile('src/b.ts', 'declare const xs: number[];\n\n\n\nxs.map((n) => n);\n');
      const firstNode = first.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);
      const movedNode = moved.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readFunctionNameLayerAdapter({ node: firstNode })).toBe(
        readFunctionNameLayerAdapter({ node: movedNode }),
      );
    });
  });
});

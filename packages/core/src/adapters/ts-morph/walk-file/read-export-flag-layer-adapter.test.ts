import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readExportFlagLayerAdapter } from './read-export-flag-layer-adapter';
import { readExportFlagLayerAdapterProxy } from './read-export-flag-layer-adapter.proxy';

describe('readExportFlagLayerAdapter', () => {
  describe('function declarations', () => {
    it('VALID: {export function} => true', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });

    it('VALID: {plain function} => false', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });

    it('VALID: {nested function inside an exported one} => false, since reach is NOT inherited', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function outer(): void {\n  function inner(): void {}\n  inner();\n}\n',
      );
      const node = sourceFile.getFunctionOrThrow('outer').getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: true }) })).toBe(false);
    });
  });

  describe('bindings', () => {
    it('VALID: {exported const arrow} => true', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });

    it('VALID: {plain const arrow} => false', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });

    it('VALID: {default-exported arrow} => true', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });
  });

  describe('class members', () => {
    it('VALID: {method of an exported class} => true, inheriting the class reach from context', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: true }) })).toBe(true);
    });

    it('VALID: {method of a plain class} => false', () => {
      readExportFlagLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readExportFlagLayerAdapter({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });
  });
});

import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { readExportFlagLayerTransformer } from './read-export-flag-layer-transformer';
import { readExportFlagLayerTransformerProxy } from './read-export-flag-layer-transformer.proxy';

describe('readExportFlagLayerAdapter', () => {
  describe('function declarations', () => {
    it('VALID: {export function} => true', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });

    it('VALID: {plain function} => false', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });

    it('VALID: {nested function inside an exported one} => false, since reach is NOT inherited', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export function outer(): void {\n  function inner(): void {}\n  inner();\n}\n',
      );
      const node = sourceFile.getFunctionOrThrow('outer').getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: true }) })).toBe(false);
    });
  });

  describe('bindings', () => {
    it('VALID: {exported const arrow} => true', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });

    it('VALID: {plain const arrow} => false', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });

    it('VALID: {default-exported arrow} => true', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });
  });

  describe('an export stated in a later statement', () => {
    it('VALID: {const arrow, export default f} => true', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport default f;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });

    it('VALID: {const arrow, export { f as default }} => true', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport { f as default };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });

    it('VALID: {function declaration, export { f }} => true', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n\nexport { f };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(true);
    });
  });

  describe('class members', () => {
    it('VALID: {method of an exported class} => true, inheriting the class reach from context', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: true }) })).toBe(true);
    });

    it('VALID: {method of a plain class} => false', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });

    it('VALID: {get accessor of an exported class} => true, inheriting the class reach from context', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  get m(): string {\n    return "x";\n  }\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.GetAccessor);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: true }) })).toBe(true);
    });

    it('VALID: {set accessor of a plain class} => false', () => {
      readExportFlagLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  set m(v: string) {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SetAccessor);

      expect(readExportFlagLayerTransformer({ node, context: WalkContextStub({ exported: false }) })).toBe(false);
    });
  });
});

import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readModuleExportLayerTransformer } from './read-module-export-layer-transformer';
import { readModuleExportLayerTransformerProxy } from './read-module-export-layer-transformer.proxy';

describe('readModuleExportLayerTransformer', () => {
  describe('the export keyword on the declaration', () => {
    it('VALID: {export const f} => f', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readModuleExportLayerTransformer({ node })).toBe('f');
    });

    it('VALID: {export default function f} => default', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readModuleExportLayerTransformer({ node })).toBe('default');
    });
  });

  describe('an export stated in a later statement', () => {
    it('VALID: {const f; export default f} => default', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport default f;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readModuleExportLayerTransformer({ node })).toBe('default');
    });

    it('VALID: {const f; export { f as default }} => default', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport { f as default };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readModuleExportLayerTransformer({ node })).toBe('default');
    });

    it('VALID: {const f; export { f as go }} => go, the EXPORTED name rather than the local one', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport { f as go };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readModuleExportLayerTransformer({ node })).toBe('go');
    });
  });

  describe('a declaration nothing exports', () => {
    it('EMPTY: {a private helper in a module} => no exported name', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'const helper = (): string => "x";\nexport const use = (): string => helper();\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readModuleExportLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {a file with no module syntax at all} => no exported name', () => {
      readModuleExportLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readModuleExportLayerTransformer({ node })).toBe(undefined);
    });
  });
});

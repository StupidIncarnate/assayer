import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readObjectMemberAccessLayerTransformer } from './read-object-member-access-layer-transformer';
import { readObjectMemberAccessLayerTransformerProxy } from './read-object-member-access-layer-transformer.proxy';

describe('readObjectMemberAccessLayerTransformer', () => {
  describe('functions stored on an exported object', () => {
    it('VALID: {arrow property of an exported const object} => object-member naming the object and the property', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  run: (): void => {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'run',
      });
    });

    it('VALID: {function expression property of an exported const object} => object-member', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  run: function (): void {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionExpression);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'run',
      });
    });

    it('VALID: {method of an exported const object} => object-member', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  run(): void {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'run',
      });
    });

    it('VALID: {getter of an exported const object} => object-member carrying accessor: "get"', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  get level(): number {\n    return 1;\n  },\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.GetAccessor);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'level',
        accessor: 'get',
      });
    });

    it('VALID: {setter of an exported const object} => object-member carrying accessor: "set"', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  set level(value: number) {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SetAccessor);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'level',
        accessor: 'set',
      });
    });

    it('VALID: {quoted property key} => the property reads without its quotes', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "export const api = {\n  'run': (): void => {},\n};\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'run',
      });
    });

    it('VALID: {object exported by default} => objectName "default"', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default {\n  run(): void {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'default',
        property: 'run',
      });
    });

    it('VALID: {object exported in a later statement under another name} => objectName is the exported name', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const api = {\n  run(): void {},\n};\n\nexport { api as service };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'service',
        property: 'run',
      });
    });

    it('VALID: {exported object wrapped in `as const`} => object-member, since the wrapper changes nothing at run time', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  run(): void {},\n} as const;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toStrictEqual({
        kind: 'object-member',
        objectName: 'api',
        property: 'run',
      });
    });
  });

  describe('functions no importer can reach through an object', () => {
    it('EMPTY: {method of an unexported object} => undefined', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const api = {\n  run(): void {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {object assigned with `export =`} => undefined, since the object is the module and no property holds it', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export = {\n  run(): void {},\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {computed property key} => undefined, since the key is not known before the code runs', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', "const key = 'run';\nexport const api = {\n  [key]: (): void => {},\n};\n");
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {object nested inside an exported object} => undefined, since only a direct property is read', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  inner: {\n    run(): void {},\n  },\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {arrow passed as an argument inside an exported object} => undefined, since no property holds the arrow', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const api = {\n  list: [1].map((n: number): number => n),\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {method of a class} => undefined, since a class member is not an object property', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  run(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });

    it('EMPTY: {exported const arrow} => undefined, since it is a named export, not an object member', () => {
      readObjectMemberAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const run = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readObjectMemberAccessLayerTransformer({ node })).toBe(undefined);
    });
  });
});

import { Project, SyntaxKind } from '#gateway/npm/ts-morph';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { readEntryAccessLayerTransformer } from './read-entry-access-layer-transformer';
import { readEntryAccessLayerTransformerProxy } from './read-entry-access-layer-transformer.proxy';

describe('readEntryAccessLayerTransformer', () => {
  describe('function declarations', () => {
    it('VALID: {export function} => named', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'named' });
    });

    it('VALID: {export default function} => default, since it is reached through `default`', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {plain function} => unreachable', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });
  });

  describe('bindings', () => {
    it('VALID: {exported const arrow} => named', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'named' });
    });

    it('VALID: {default-exported arrow} => default', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {plain const arrow} => unreachable', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });
  });

  describe('exports stated in a later statement', () => {
    it('VALID: {const arrow, export default f} => default, the same as `export default function`', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport default f;\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {const arrow, export { f as default }} => default', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport { f as default };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {const arrow, export { f }} => named, with no separate module property', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport { f };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'named' });
    });

    it('VALID: {const arrow, export { f as go }} => named carrying `go`, the property the module holds it under', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n\nexport { f as go };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({
        kind: 'named',
        exportedName: 'go',
      });
    });

    it('VALID: {function declaration, export { f as default }} => default', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n\nexport { f as default };\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });
  });

  describe('class members', () => {
    it('VALID: {method of a zero-arg class} => method carrying the class name, constructable', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(
        readEntryAccessLayerTransformer({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: true } }),
        }),
      ).toStrictEqual({ kind: 'method', className: 'C', constructable: true });
    });

    it('VALID: {method of a class needing ctor args} => method, NOT constructable', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(private readonly db: string) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(
        readEntryAccessLayerTransformer({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: false } }),
        }),
      ).toStrictEqual({ kind: 'method', className: 'C', constructable: false });
    });

    // Not a method: resolving it as one yields the class, and applying that without `new` throws.
    it('VALID: {a constructor} => its own kind, never a method', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  constructor() {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);

      expect(
        readEntryAccessLayerTransformer({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: true } }),
        }),
      ).toStrictEqual({ kind: 'constructor', className: 'C' });
    });

    it('EDGE: {a constructor with no class in context} => unreachable rather than a guessed class name', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  constructor() {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });

    it('VALID: {get accessor of a class} => method, the same access shape a plain method gets', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  get m(): string {\n    return "x";\n  }\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.GetAccessor);

      expect(
        readEntryAccessLayerTransformer({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: true } }),
        }),
      ).toStrictEqual({ kind: 'method', className: 'C', constructable: true });
    });

    it('VALID: {set accessor of a class} => method, the same access shape a plain method gets', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  set m(v: string) {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SetAccessor);

      expect(
        readEntryAccessLayerTransformer({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: true } }),
        }),
      ).toStrictEqual({ kind: 'method', className: 'C', constructable: true });
    });

    it('EDGE: {method with no class in context} => unreachable rather than a guessed class name', () => {
      readEntryAccessLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readEntryAccessLayerTransformer({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });
  });
});

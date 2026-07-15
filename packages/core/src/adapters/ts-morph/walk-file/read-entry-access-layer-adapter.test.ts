import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readEntryAccessLayerAdapter } from './read-entry-access-layer-adapter';
import { readEntryAccessLayerAdapterProxy } from './read-entry-access-layer-adapter.proxy';

describe('readEntryAccessLayerAdapter', () => {
  describe('function declarations', () => {
    it('VALID: {export function} => named', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'named' });
    });

    it('VALID: {export default function} => default, since it is reached through `default`', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {plain function} => unreachable', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function f(): void {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.FunctionDeclaration);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });
  });

  describe('bindings', () => {
    it('VALID: {exported const arrow} => named', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'named' });
    });

    it('VALID: {default-exported arrow} => default', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'default' });
    });

    it('VALID: {plain const arrow} => unreachable', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'const f = (): void => {};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });
  });

  describe('class members', () => {
    it('VALID: {method of a zero-arg class} => method carrying the class name, constructable', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(
        readEntryAccessLayerAdapter({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: true } }),
        }),
      ).toStrictEqual({ kind: 'method', className: 'C', constructable: true });
    });

    it('VALID: {method of a class needing ctor args} => method, NOT constructable', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(private readonly db: string) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(
        readEntryAccessLayerAdapter({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: false } }),
        }),
      ).toStrictEqual({ kind: 'method', className: 'C', constructable: false });
    });

    // Not a method: resolving it as one yields the class, and applying that without `new` throws.
    it('VALID: {a constructor} => its own kind, never a method', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  constructor() {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Constructor);

      expect(
        readEntryAccessLayerAdapter({
          node,
          context: WalkContextStub({ enclosingClass: { name: 'C', constructable: true } }),
        }),
      ).toStrictEqual({ kind: 'constructor', className: 'C' });
    });

    it('EDGE: {method with no class in context} => unreachable rather than a guessed class name', () => {
      readEntryAccessLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.MethodDeclaration);

      expect(readEntryAccessLayerAdapter({ node, context: WalkContextStub() })).toStrictEqual({ kind: 'unreachable' });
    });
  });
});

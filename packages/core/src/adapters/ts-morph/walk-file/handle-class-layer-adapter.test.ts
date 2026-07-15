import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { handleClassLayerAdapter } from './handle-class-layer-adapter';
import { handleClassLayerAdapterProxy } from './handle-class-layer-adapter.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

describe('handleClassLayerAdapter', () => {
  describe('naming scope', () => {
    it('VALID: {class} => opens NO scope record, because a class holds no control flow', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect({ opensScope: result.opensScope }).toStrictEqual({ opensScope: undefined });
    });

    it('VALID: {class} => records itself as a handled node under its own path', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.nodes).toStrictEqual([
        WalkNodeStub({
          kind: 'ClassDeclaration',
          scopePath: ['*module*', 'C'],
          name: 'C',
          startLine: 1,
          endLine: 3,
        }),
      ]);
    });
  });

  describe('export reach handed to members', () => {
    it('VALID: {exported class} => hands members exported: true', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context)).toStrictEqual([
        WalkContextStub({
          scopePath: ['*module*', 'C'],
          guardPath: [],
          params: [],
          exported: true,
          enclosingClass: { name: 'C', constructable: true },
        }),
      ]);
    });

    it('VALID: {plain class} => hands members exported: false', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context)).toStrictEqual([
        WalkContextStub({
          scopePath: ['*module*', 'C'],
          guardPath: [],
          params: [],
          exported: false,
          enclosingClass: { name: 'C', constructable: true },
        }),
      ]);
    });
  });

  // A method is only addressable through an instance, and the class is the only node that knows what
  // making one costs. Handed DOWN rather than climbed for.
  describe('constructability handed to members', () => {
    it('VALID: {no constructor} => constructable, since an instance costs nothing', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: true },
      ]);
    });

    it('VALID: {constructor needing an argument} => NOT constructable', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(readonly db: string) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: false },
        { name: 'C', constructable: false },
      ]);
    });

    it('VALID: {constructor whose every argument is omittable} => constructable', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(a?: string, b: number = 1) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: true },
        { name: 'C', constructable: true },
      ]);
    });
  });

  describe('the descents it asks for', () => {
    it('VALID: {class with several members} => one descent per member', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'class C {\n  v = 1;\n  constructor() {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerAdapter({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'PropertyDeclaration',
        'Constructor',
        'MethodDeclaration',
      ]);
    });

    it('VALID: {class declared inside a guarded arm} => RESETS the guard path for its members', () => {
      handleClassLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);
      const guarded = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [{ branchCoverageId: '*module*/if:id:flag', arm: 'then' }],
        params: [],
        exported: false,
      });

      const result = handleClassLayerAdapter({ node, context: guarded });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[]]);
    });
  });
});

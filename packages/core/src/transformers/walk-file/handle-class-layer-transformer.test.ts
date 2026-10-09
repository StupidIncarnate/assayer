import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { handleClassLayerTransformer } from './handle-class-layer-transformer';
import { handleClassLayerTransformerProxy } from './handle-class-layer-transformer.proxy';

const MODULE_CONTEXT = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false });

describe('handleClassLayerTransformer', () => {
  describe('naming scope', () => {
    it('VALID: {class} => opens NO scope record, because a class holds no control flow', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({ opensScope: result.opensScope }).toStrictEqual({ opensScope: undefined });
    });

    it('VALID: {class} => records itself as a handled node under its own path', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

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

    // An anonymous default-export class has no identifier `node.getName()` could return, so the handler
    // falls back to the literal name 'default' — the only name a class expression's own descent could
    // ever attach a coverage path to.
    it('VALID: {anonymous default-export class} => names it "default", never undefined', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default class {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({ scopePath: result.nodes[0]?.scopePath, name: result.nodes[0]?.name }).toStrictEqual({
        scopePath: ['*module*', 'default'],
        name: 'default',
      });
    });
  });

  // A class DECLARES a shape too — its instance type, on the same flat channel an `interface`/`type`
  // declaration uses (packages/core/CLAUDE.md §3) — so a sibling taking a `Point` gets the same answer
  // whether `Point` is an interface or a class.
  describe('the instance shape it declares', () => {
    it('VALID: {a named class} => the instance shape, keyed by the class name, on the SAME channel an interface uses', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'class Point {\n  x: number = 0;\n  y: number = 0;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Point',
          type: {
            kind: 'object',
            typeName: 'Point',
            properties: [
              { name: 'x', type: { kind: 'number' } },
              { name: 'y', type: { kind: 'number' } },
            ],
          },
        },
      ]);
    });

    it('VALID: {a generic class} => the shape carries its type PARAMETERS beside the descriptor', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'class Box<T> {\n  value: T | undefined;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes).toStrictEqual([
        {
          name: 'Box',
          type: {
            kind: 'object',
            typeName: 'Box',
            properties: [{ name: 'value', type: { kind: 'unknown', text: 'T | undefined' } }],
          },
          typeParams: ['T'],
        },
      ]);
    });

    // Only a NAMED class declares a shape a reference could resolve by — a class expression, even one
    // bound to a `const`, has no such identifier of its own.
    it('EMPTY: {an anonymous class} => declares NO shape at all, since no reference could name it', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export default class {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes).toStrictEqual([]);
    });

    it('EMPTY: {a class expression} => declares NO shape either, for the same reason', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const C = class {\n  m(): void {}\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassExpression);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.declaredShapes).toStrictEqual([]);
    });
  });

  describe('export reach handed to members', () => {
    it('VALID: {exported class} => hands members exported: true', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

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
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

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

    // A class EXPRESSION declares no exported binding of its own — `isExported()` only exists on a
    // declaration — so its members inherit the export reach the enclosing context already carries.
    it('VALID: {class expression, exported context} => hands members exported: true FROM THE CONTEXT', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export const C = class {\n  m(): void {}\n};\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassExpression);
      const exportedContext = WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true });

      const result = handleClassLayerTransformer({ node, context: exportedContext });

      expect(result.descents.map((descent) => descent.context.exported)).toStrictEqual([true]);
    });
  });

  // A method is only addressable through an instance, and the class is the only node that knows what
  // making one costs. Handed DOWN rather than climbed for.
  describe('constructability handed to members', () => {
    it('VALID: {no constructor} => constructable, since an instance costs nothing', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: true },
      ]);
    });

    it('VALID: {constructor needing an argument} => NOT constructable', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(readonly db: string) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: false },
        { name: 'C', constructable: false },
      ]);
    });

    it('VALID: {constructor whose every argument is omittable} => constructable', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(a?: string, b: number = 1) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: true },
        { name: 'C', constructable: true },
      ]);
    });

    it('VALID: {constructor whose only parameter is a rest parameter} => constructable', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'export class C {\n  constructor(...args: string[]) {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.context.enclosingClass)).toStrictEqual([
        { name: 'C', constructable: true },
        { name: 'C', constructable: true },
      ]);
    });
  });

  describe('the descents it asks for', () => {
    it('VALID: {class with several members} => one descent per member, since none of them is an instance field initializer', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'class C {\n  static v = 1;\n  constructor() {}\n  m(): void {}\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'PropertyDeclaration',
        'Constructor',
        'MethodDeclaration',
      ]);
    });

    it('VALID: {class declared inside a guarded arm} => RESETS the guard path for its members', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'class C {\n  m(): void {}\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);
      const guarded = WalkContextStub({
        scopePath: ['*module*'],
        guardPath: [{ branchCoverageId: '*module*/if:id:flag', arm: 'then' }],
        params: [],
        exported: false,
      });

      const result = handleClassLayerTransformer({ node, context: guarded });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([[]]);
    });
  });

  describe('instance field initializers', () => {
    it('VALID: {an instance field with an initializer, no constructor} => opens the implicit constructor over the initializer', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const flag: boolean;\nexport class Labeller {\n  label = flag ? 'a' : 'b';\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      const implicit = result.implicitScopes?.[0];

      expect({
        count: result.implicitScopes?.length,
        scopePath: implicit?.opensScope?.scopePath,
        access: implicit?.opensScope?.access,
        descents: implicit?.descents.map((descent) => descent.node.getKindName()),
      }).toStrictEqual({
        count: 1,
        scopePath: ['*module*', 'Labeller', 'constructor'],
        access: { kind: 'constructor', className: 'Labeller' },
        descents: ['ConditionalExpression'],
      });
    });

    it('VALID: {an instance field with an initializer} => the class descends the rest of the field, never its initializer', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const flag: boolean;\nexport class Labeller {\n  label = flag ? 'a' : 'b';\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['Identifier']);
    });

    it('VALID: {a static field with an initializer} => descended by the class, and no implicit constructor', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const flag: boolean;\nexport class Labeller {\n  static label = flag ? 'a' : 'b';\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({
        implicitScopes: result.implicitScopes,
        descents: result.descents.map((descent) => descent.node.getKindName()),
      }).toStrictEqual({ implicitScopes: undefined, descents: ['PropertyDeclaration'] });
    });

    it('VALID: {an instance field and a written constructor} => no implicit constructor, since the written one walks the initializer', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const flag: boolean;\nexport class Labeller {\n  label = flag ? 'a' : 'b';\n  constructor() {}\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({
        implicitScopes: result.implicitScopes,
        descents: result.descents.map((descent) => descent.node.getKindName()),
      }).toStrictEqual({ implicitScopes: undefined, descents: ['Identifier', 'Constructor'] });
    });

    it('EMPTY: {an instance field with no initializer} => no implicit constructor, since construction runs nothing for it', () => {
      handleClassLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'export class Labeller {\n  label?: string;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);

      const result = handleClassLayerTransformer({ node, context: MODULE_CONTEXT });

      expect({
        implicitScopes: result.implicitScopes,
        descents: result.descents.map((descent) => descent.node.getKindName()),
      }).toStrictEqual({ implicitScopes: undefined, descents: ['PropertyDeclaration'] });
    });
  });
});

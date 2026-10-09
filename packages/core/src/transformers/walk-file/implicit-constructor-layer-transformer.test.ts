import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { implicitConstructorLayerTransformer } from './implicit-constructor-layer-transformer';
import { implicitConstructorLayerTransformerProxy } from './implicit-constructor-layer-transformer.proxy';

const CLASS_CONTEXT = WalkContextStub({
  scopePath: ['*module*', 'Labeller'],
  guardPath: [],
  params: [],
  exported: true,
  enclosingClass: { name: 'Labeller', constructable: true },
});

const SOURCE = "declare const flag: boolean;\nexport class Labeller {\n  first = 'x';\n  label = flag ? 'a' : 'b';\n}\n";

describe('implicitConstructorLayerTransformer', () => {
  describe('the scope it opens', () => {
    it('VALID: {a class with two initialized fields} => a `constructor` scope reached through `new` on the class, taking no parameters', () => {
      implicitConstructorLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', SOURCE);
      const classNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);
      const first = classNode.getPropertyOrThrow('first').getInitializerOrThrow();
      const label = classNode.getPropertyOrThrow('label').getInitializerOrThrow();

      const result = implicitConstructorLayerTransformer({
        classNode,
        className: 'Labeller',
        context: CLASS_CONTEXT,
        initializers: [first, label],
        lastInitializer: label,
      });

      expect({
        scopePath: result.opensScope?.scopePath,
        name: result.opensScope?.name,
        kind: result.opensScope?.kind,
        exported: result.opensScope?.exported,
        access: result.opensScope?.access,
        params: result.opensScope?.params,
        startLine: result.opensScope?.startLine,
        endLine: result.opensScope?.endLine,
      }).toStrictEqual({
        scopePath: ['*module*', 'Labeller', 'constructor'],
        name: 'constructor',
        kind: 'function',
        exported: true,
        access: { kind: 'constructor', className: 'Labeller' },
        params: [],
        startLine: 2,
        endLine: 5,
      });
    });

    it('VALID: {a class with two initialized fields} => one implicit exit, probed by wrapping the LAST initializer', () => {
      implicitConstructorLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', SOURCE);
      const classNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);
      const first = classNode.getPropertyOrThrow('first').getInitializerOrThrow();
      const label = classNode.getPropertyOrThrow('label').getInitializerOrThrow();

      const result = implicitConstructorLayerTransformer({
        classNode,
        className: 'Labeller',
        context: CLASS_CONTEXT,
        initializers: [first, label],
        lastInitializer: label,
      });

      expect({ exits: result.exits, probeSites: result.probeSites }).toStrictEqual({
        exits: [
          { coverageId: '*module*/Labeller/constructor/exit@top', kind: 'implicit', guardPath: [], line: 5 },
        ],
        probeSites: [
          { id: '*module*/Labeller/constructor/exit@top', kind: 'exit', start: label.getStart(), end: label.getEnd() },
        ],
      });
    });

    it('VALID: {a class with two initialized fields} => each initializer descends under the constructor scope, never in tail position', () => {
      implicitConstructorLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', SOURCE);
      const classNode = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ClassDeclaration);
      const first = classNode.getPropertyOrThrow('first').getInitializerOrThrow();
      const label = classNode.getPropertyOrThrow('label').getInitializerOrThrow();

      const result = implicitConstructorLayerTransformer({
        classNode,
        className: 'Labeller',
        context: CLASS_CONTEXT,
        initializers: [first, label],
        lastInitializer: label,
      });

      expect(
        result.descents.map((descent) => ({
          kind: descent.node.getKindName(),
          scopePath: descent.context.scopePath,
          guardPath: descent.context.guardPath,
          params: descent.context.params,
          tail: descent.context.tail,
        })),
      ).toStrictEqual([
        { kind: 'StringLiteral', scopePath: ['*module*', 'Labeller', 'constructor'], guardPath: [], params: [], tail: false },
        { kind: 'ConditionalExpression', scopePath: ['*module*', 'Labeller', 'constructor'], guardPath: [], params: [], tail: false },
      ]);
    });
  });
});

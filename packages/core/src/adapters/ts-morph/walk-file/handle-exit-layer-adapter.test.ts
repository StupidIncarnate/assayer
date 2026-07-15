import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { handleExitLayerAdapter } from './handle-exit-layer-adapter';
import { handleExitLayerAdapterProxy } from './handle-exit-layer-adapter.proxy';

const UNGUARDED_CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

const GUARDED_CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [{ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

describe('handleExitLayerAdapter', () => {
  describe('the exit it emits', () => {
    it('VALID: {unguarded return} => one return exit keyed @top', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return "small";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = handleExitLayerAdapter({ node, context: UNGUARDED_CONTEXT });

      expect(result.exits).toStrictEqual([
        { coverageId: 'classify/return@top', kind: 'return', guardPath: [], line: 2 },
      ]);
    });

    it('VALID: {throw} => one throw exit, distinguished from a return', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  throw new Error("nope");\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ThrowStatement);

      const result = handleExitLayerAdapter({ node, context: UNGUARDED_CONTEXT });

      expect(result.exits).toStrictEqual([{ coverageId: 'classify/throw@top', kind: 'throw', guardPath: [], line: 2 }]);
    });
  });

  describe('the guard it reads straight off the context', () => {
    it('VALID: {return reached through an if-then} => the exit carries that guard and keys on it', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = handleExitLayerAdapter({ node, context: GUARDED_CONTEXT });

      expect(result.exits).toStrictEqual([
        {
          coverageId: 'classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
          kind: 'return',
          guardPath: [
            { branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' },
          ],
          line: 2,
        },
      ]);
    });
  });

  describe('the returned expression it descends into', () => {
    it('VALID: {return with an expression} => descends that expression, since scopes and branches hide in it', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return "small";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = handleExitLayerAdapter({ node, context: UNGUARDED_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['StringLiteral']);
    });

    it('VALID: {throw new Error(...)} => descends the thrown expression', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  throw new Error("nope");\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ThrowStatement);

      const result = handleExitLayerAdapter({ node, context: UNGUARDED_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual(['NewExpression']);
    });

    it('VALID: {return with an expression} => hands the expression the unchanged context', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return "big";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = handleExitLayerAdapter({ node, context: GUARDED_CONTEXT });

      expect(result.descents.map((descent) => descent.context)).toStrictEqual([GUARDED_CONTEXT]);
    });

    it('EMPTY: {bare return} => no descents, because there is no expression', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return;\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = handleExitLayerAdapter({ node, context: UNGUARDED_CONTEXT });

      expect(result.descents).toStrictEqual([]);
    });
  });

  describe('what it does NOT contribute', () => {
    it('VALID: {return} => no branches and no walk nodes of its own', () => {
      handleExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return "small";\n}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement);

      const result = handleExitLayerAdapter({ node, context: UNGUARDED_CONTEXT });

      expect({ branches: result.branches, nodes: result.nodes, opensScope: result.opensScope }).toStrictEqual({
        branches: [],
        nodes: [],
        opensScope: undefined,
      });
    });
  });
});

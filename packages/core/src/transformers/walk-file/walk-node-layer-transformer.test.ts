import { Project } from '#gateway/npm/ts-morph';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { walkNodeLayerTransformer } from './walk-node-layer-transformer';
import { walkNodeLayerTransformerProxy } from './walk-node-layer-transformer.proxy';

const SEED = WalkContextStub({ scopePath: [], guardPath: [], params: [], exported: false });

describe('walkNodeLayerAdapter', () => {
  describe('recursion', () => {
    it('VALID: {nested functions} => reaches every depth, since it calls itself per descent', () => {
      walkNodeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile(
        'src/f.ts',
        'export function a(): void {\n  function b(): void {\n    function c(): void {}\n    c();\n  }\n  b();\n}\n',
      );

      const result = walkNodeLayerTransformer({ node, context: SEED });

      expect(result.scopes.map((scope) => scope.scopePath)).toStrictEqual([
        ['*module*'],
        ['*module*', 'a'],
        ['*module*', 'a', 'b'],
        ['*module*', 'a', 'b', 'c'],
      ]);
    });
  });

  describe('scope claiming', () => {
    it('VALID: {completed walk} => leaves NO loose facts, because the module scope claims the rest', () => {
      walkNodeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'export function a(): void {}\n');

      const result = walkNodeLayerTransformer({ node, context: SEED });

      expect({ looseBranches: result.looseBranches, looseExits: result.looseExits }).toStrictEqual({
        looseBranches: [],
        looseExits: [],
      });
    });

    it('VALID: {file with a dark spot} => the node record survives the climb back up', () => {
      walkNodeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile(
        'src/f.ts',
        'export function a(xs: number[]): void {\n  for (const x of xs) {\n    xs.pop();\n  }\n}\n',
      );

      const result = walkNodeLayerTransformer({ node, context: SEED });

      expect(result.nodes.map((walkNode) => ({ kind: walkNode.kind, handled: walkNode.handled }))).toStrictEqual([
        { kind: 'FunctionDeclaration', handled: true },
        { kind: 'ForOfStatement', handled: false },
      ]);
    });

    it('VALID: {calls, a value use and an exported binding at module scope} => each channel is CLAIMED onto its own scope, not dropped', () => {
      walkNodeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile(
        'src/f.ts',
        "const helper = (): string => 'x';\nexport const ref = helper;\nhelper();\n",
      );

      const result = walkNodeLayerTransformer({ node, context: SEED });

      expect(
        result.scopes.map((scope) => ({
          scopePath: scope.scopePath,
          valueUses: scope.valueUses,
          exportedBindings: scope.exportedBindings,
          calls: scope.calls,
        })),
      ).toStrictEqual([
        {
          scopePath: ['*module*'],
          valueUses: [{ target: 'local', name: 'helper', startLine: 1 }],
          exportedBindings: ['ref'],
          calls: [
            {
              callee: { target: 'local', name: 'helper', startLine: 1 },
              args: [],
              guardPath: [],
              position: { line: 3, column: 1 },
            },
          ],
        },
        { scopePath: ['*module*', 'helper'], valueUses: [], exportedBindings: [], calls: [] },
      ]);
    });
  });
});

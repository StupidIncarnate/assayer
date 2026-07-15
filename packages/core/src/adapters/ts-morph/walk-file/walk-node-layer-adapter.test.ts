import { Project } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { walkNodeLayerAdapter } from './walk-node-layer-adapter';
import { walkNodeLayerAdapterProxy } from './walk-node-layer-adapter.proxy';

const SEED = WalkContextStub({ scopePath: [], guardPath: [], params: [], exported: false });

describe('walkNodeLayerAdapter', () => {
  describe('recursion', () => {
    it('VALID: {nested functions} => reaches every depth, since it calls itself per descent', () => {
      walkNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile(
        'src/f.ts',
        'export function a(): void {\n  function b(): void {\n    function c(): void {}\n    c();\n  }\n  b();\n}\n',
      );

      const result = walkNodeLayerAdapter({ node, context: SEED });

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
      walkNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile('src/f.ts', 'export function a(): void {}\n');

      const result = walkNodeLayerAdapter({ node, context: SEED });

      expect({ looseBranches: result.looseBranches, looseExits: result.looseExits }).toStrictEqual({
        looseBranches: [],
        looseExits: [],
      });
    });

    it('VALID: {file with a dark spot} => the node record survives the climb back up', () => {
      walkNodeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const node = project.createSourceFile(
        'src/f.ts',
        'export function a(xs: number[]): void {\n  for (const x of xs) {\n    xs.pop();\n  }\n}\n',
      );

      const result = walkNodeLayerAdapter({ node, context: SEED });

      expect(result.nodes.map((walkNode) => ({ kind: walkNode.kind, handled: walkNode.handled }))).toStrictEqual([
        { kind: 'FunctionDeclaration', handled: true },
        { kind: 'ForOfStatement', handled: false },
      ]);
    });
  });
});

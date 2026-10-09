import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { settleHandlerLayerTransformer } from './settle-handler-layer-transformer';
import { settleHandlerLayerTransformerProxy } from './settle-handler-layer-transformer.proxy';
import { walkNodeLayerTransformer } from './walk-node-layer-transformer';

const CONTEXT = WalkContextStub({ scopePath: ['*module*', 'pick'], guardPath: [], params: [], exported: true });

describe('settleHandlerLayerTransformer', () => {
  describe('a handler that opens no scope', () => {
    it('VALID: {a branch, no scope} => the branch stays LOOSE, for the enclosing scope to claim', () => {
      settleHandlerLayerTransformerProxy();
      const branch = BranchNodeStub();

      const result = settleHandlerLayerTransformer({
        handled: handlerResultLayerTransformer({ branches: [branch] }),
        walk: walkNodeLayerTransformer,
      });

      expect({ scopes: result.scopes, looseBranches: result.looseBranches }).toStrictEqual({
        scopes: [],
        looseBranches: [branch],
      });
    });

    it('VALID: {a descent holding a ternary} => the descent is walked, and its branch comes back loose', () => {
      settleHandlerLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const flag: boolean;\ndeclare function log(text: string): void;\nlog(flag ? 'a' : 'b');\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.CallExpression);

      const result = settleHandlerLayerTransformer({
        handled: handlerResultLayerTransformer({ descents: [{ node, context: CONTEXT }] }),
        walk: walkNodeLayerTransformer,
      });

      expect(result.looseBranches.map((branch) => ({ coverageId: branch.coverageId, kind: branch.kind }))).toStrictEqual([
        { coverageId: '*module*/pick/ternary:id:flag', kind: 'ternary' },
      ]);
    });
  });

  describe('a handler that opens a scope', () => {
    it('VALID: {a branch and an opened scope} => the scope claims the branch, leaving nothing loose', () => {
      settleHandlerLayerTransformerProxy();
      const branch = BranchNodeStub();

      const result = settleHandlerLayerTransformer({
        handled: handlerResultLayerTransformer({ branches: [branch], opensScope: ScopeRecordStub() }),
        walk: walkNodeLayerTransformer,
      });

      expect({ scopes: result.scopes, looseBranches: result.looseBranches }).toStrictEqual({
        scopes: [ScopeRecordStub({ branches: [branch] })],
        looseBranches: [],
      });
    });
  });

  describe('an implicit scope', () => {
    it('VALID: {an implicit scope beside a loose branch} => the implicit scope claims only its own branch, and the other stays loose', () => {
      settleHandlerLayerTransformerProxy();
      const own = BranchNodeStub({ coverageId: 'Labeller/constructor/ternary:id:flag' });
      const outer = BranchNodeStub();
      const implicitScope = ScopeRecordStub({ scopePath: ['Labeller', 'constructor'], name: 'constructor', params: [] });

      const result = settleHandlerLayerTransformer({
        handled: handlerResultLayerTransformer({
          branches: [outer],
          implicitScopes: [handlerResultLayerTransformer({ branches: [own], opensScope: implicitScope })],
        }),
        walk: walkNodeLayerTransformer,
      });

      expect({ scopes: result.scopes, looseBranches: result.looseBranches }).toStrictEqual({
        scopes: [ScopeRecordStub({ scopePath: ['Labeller', 'constructor'], name: 'constructor', params: [], branches: [own] })],
        looseBranches: [outer],
      });
    });

    it('VALID: {an implicit scope inside an opened scope} => both are completed, the opened scope first', () => {
      settleHandlerLayerTransformerProxy();
      const implicitScope = ScopeRecordStub({ scopePath: ['Labeller', 'constructor'], name: 'constructor', params: [] });
      const opened = ScopeRecordStub({ scopePath: ['*module*'], name: '*module*' });

      const result = settleHandlerLayerTransformer({
        handled: handlerResultLayerTransformer({
          opensScope: opened,
          implicitScopes: [handlerResultLayerTransformer({ opensScope: implicitScope })],
        }),
        walk: walkNodeLayerTransformer,
      });

      expect(result.scopes.map((scope) => scope.scopePath)).toStrictEqual([['*module*'], ['Labeller', 'constructor']]);
    });
  });
});

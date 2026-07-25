import { BranchNodeStub, EnvReadStub, ExitNodeStub, GlobalUseStub, ModuleEdgeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../../contracts/call-site/call-site.stub';
import { DeclaredShapeStub } from '../../../contracts/declared-shape/declared-shape.stub';
import { InvokedFnStub } from '../../../contracts/invoked-fn/invoked-fn.stub';
import { ProbeSiteStub } from '../../../contracts/probe-site/probe-site.stub';
import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { ValueUseStub } from '../../../contracts/value-use/value-use.stub';
import { WalkFactsStub } from '../../../contracts/walk-facts/walk-facts.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { walkFactsLayerAdapter } from './walk-facts-layer-adapter';
import { walkFactsLayerAdapterProxy } from './walk-facts-layer-adapter.proxy';

describe('walkFactsLayerAdapter', () => {
  describe('merging', () => {
    it('EMPTY: {no facts} => an empty fact set', () => {
      walkFactsLayerAdapterProxy();

      expect(walkFactsLayerAdapter({ facts: [] })).toStrictEqual(WalkFactsStub());
    });

    it('VALID: {two fact sets} => every list concatenated in source order', () => {
      walkFactsLayerAdapterProxy();
      const first = WalkFactsStub({
        scopes: [ScopeRecordStub({ name: 'a', scopePath: ['a'] })],
        nodes: [WalkNodeStub({ startLine: 1, endLine: 2 })],
      });
      const second = WalkFactsStub({
        scopes: [ScopeRecordStub({ name: 'b', scopePath: ['b'] })],
        nodes: [WalkNodeStub({ startLine: 3, endLine: 4 })],
      });

      expect(walkFactsLayerAdapter({ facts: [first, second] })).toStrictEqual(
        WalkFactsStub({
          scopes: [ScopeRecordStub({ name: 'a', scopePath: ['a'] }), ScopeRecordStub({ name: 'b', scopePath: ['b'] })],
          nodes: [WalkNodeStub({ startLine: 1, endLine: 2 }), WalkNodeStub({ startLine: 3, endLine: 4 })],
        }),
      );
    });

    it('VALID: {loose facts} => stay loose, since only a scope may claim them', () => {
      walkFactsLayerAdapterProxy();
      const facts = WalkFactsStub({ looseExits: [{ coverageId: 'a/return@top', kind: 'return', guardPath: [], line: 2 }] });

      expect(walkFactsLayerAdapter({ facts: [facts] })).toStrictEqual(facts);
    });

    it('VALID: {one fact set} => does not mutate the input', () => {
      walkFactsLayerAdapterProxy();
      const only = WalkFactsStub({ scopes: [ScopeRecordStub()] });

      walkFactsLayerAdapter({ facts: [only] });

      expect(only.scopes).toStrictEqual([ScopeRecordStub()]);
    });

    it('VALID: {two fact sets, every channel populated} => EVERY channel concatenates, not only scopes and nodes', () => {
      walkFactsLayerAdapterProxy();
      const first = WalkFactsStub({
        scopes: [ScopeRecordStub({ name: 'a', scopePath: ['a'] })],
        looseBranches: [BranchNodeStub({ coverageId: 'a/if:flag' })],
        looseExits: [ExitNodeStub({ coverageId: 'a/return@top' })],
        looseCalls: [CallSiteStub({ position: { line: 1, column: 1 } })],
        looseValueUses: [ValueUseStub({ target: 'import', specifier: 'node:path', importedName: 'sep' })],
        looseExportedBindings: ['first'],
        nodes: [WalkNodeStub({ startLine: 1, endLine: 2 })],
        probeSites: [ProbeSiteStub({ id: 'a/leaf' })],
        moduleEdges: [ModuleEdgeStub({ specifier: './a' })],
        declaredShapes: [DeclaredShapeStub({ name: 'A' })],
        globalUses: [GlobalUseStub({ name: 'console' })],
        envReads: [EnvReadStub({ property: 'A' })],
        reachedFns: [1],
        invokedFns: [InvokedFnStub({ startLine: 1 })],
      });
      const second = WalkFactsStub({
        scopes: [ScopeRecordStub({ name: 'b', scopePath: ['b'] })],
        looseBranches: [BranchNodeStub({ coverageId: 'b/if:flag' })],
        looseExits: [ExitNodeStub({ coverageId: 'b/return@top' })],
        looseCalls: [CallSiteStub({ position: { line: 2, column: 1 } })],
        looseValueUses: [ValueUseStub({ target: 'global', name: 'process' })],
        looseExportedBindings: ['second'],
        nodes: [WalkNodeStub({ startLine: 3, endLine: 4 })],
        probeSites: [ProbeSiteStub({ id: 'b/leaf' })],
        moduleEdges: [ModuleEdgeStub({ specifier: './b' })],
        declaredShapes: [DeclaredShapeStub({ name: 'B' })],
        globalUses: [GlobalUseStub({ name: 'process' })],
        envReads: [EnvReadStub({ property: 'B' })],
        reachedFns: [2],
        invokedFns: [InvokedFnStub({ startLine: 2 })],
      });

      expect(walkFactsLayerAdapter({ facts: [first, second] })).toStrictEqual({
        scopes: [ScopeRecordStub({ name: 'a', scopePath: ['a'] }), ScopeRecordStub({ name: 'b', scopePath: ['b'] })],
        looseBranches: [BranchNodeStub({ coverageId: 'a/if:flag' }), BranchNodeStub({ coverageId: 'b/if:flag' })],
        looseExits: [ExitNodeStub({ coverageId: 'a/return@top' }), ExitNodeStub({ coverageId: 'b/return@top' })],
        looseCalls: [CallSiteStub({ position: { line: 1, column: 1 } }), CallSiteStub({ position: { line: 2, column: 1 } })],
        looseValueUses: [
          ValueUseStub({ target: 'import', specifier: 'node:path', importedName: 'sep' }),
          ValueUseStub({ target: 'global', name: 'process' }),
        ],
        looseExportedBindings: ['first', 'second'],
        nodes: [WalkNodeStub({ startLine: 1, endLine: 2 }), WalkNodeStub({ startLine: 3, endLine: 4 })],
        probeSites: [ProbeSiteStub({ id: 'a/leaf' }), ProbeSiteStub({ id: 'b/leaf' })],
        moduleEdges: [ModuleEdgeStub({ specifier: './a' }), ModuleEdgeStub({ specifier: './b' })],
        declaredShapes: [DeclaredShapeStub({ name: 'A' }), DeclaredShapeStub({ name: 'B' })],
        globalUses: [GlobalUseStub({ name: 'console' }), GlobalUseStub({ name: 'process' })],
        envReads: [EnvReadStub({ property: 'A' }), EnvReadStub({ property: 'B' })],
        reachedFns: [1, 2],
        invokedFns: [InvokedFnStub({ startLine: 1 }), InvokedFnStub({ startLine: 2 })],
      });
    });
  });
});

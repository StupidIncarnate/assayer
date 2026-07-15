import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
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
  });
});

import { ScopeRecordStub } from '../../../contracts/scope-record/scope-record.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { handlerResultLayerAdapterProxy } from './handler-result-layer-adapter.proxy';

describe('handlerResultLayerAdapter', () => {
  describe('defaults', () => {
    it('EMPTY: {nothing contributed} => every list empty and no scope opened', () => {
      handlerResultLayerAdapterProxy();

      expect(handlerResultLayerAdapter({})).toStrictEqual({
        branches: [],
        exits: [],
        nodes: [],
        descents: [],
      });
    });

    it('VALID: {only nodes} => the other lists still default to empty', () => {
      handlerResultLayerAdapterProxy();

      expect(handlerResultLayerAdapter({ nodes: [WalkNodeStub()] })).toStrictEqual({
        branches: [],
        exits: [],
        nodes: [WalkNodeStub()],
        descents: [],
      });
    });
  });

  describe('opensScope', () => {
    it('VALID: {opensScope given} => carried through', () => {
      handlerResultLayerAdapterProxy();

      expect(handlerResultLayerAdapter({ opensScope: ScopeRecordStub() })).toStrictEqual({
        branches: [],
        exits: [],
        nodes: [],
        descents: [],
        opensScope: ScopeRecordStub(),
      });
    });

    it('EMPTY: {opensScope omitted} => the key is ABSENT rather than undefined', () => {
      handlerResultLayerAdapterProxy();

      expect('opensScope' in handlerResultLayerAdapter({})).toBe(false);
    });
  });
});

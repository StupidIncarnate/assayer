import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';
import { handlerResultLayerTransformerProxy } from './handler-result-layer-transformer.proxy';

describe('handlerResultLayerTransformer', () => {
  describe('defaults', () => {
    it('EMPTY: {nothing contributed} => every list empty and no scope opened', () => {
      handlerResultLayerTransformerProxy();

      expect(handlerResultLayerTransformer({})).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        nodes: [],
        probeSites: [],
        moduleEdges: [],
        declaredShapes: [],
        globalUses: [],
        envReads: [],
        reachedFns: [],
        invokedFns: [],
        descents: [],
      });
    });

    it('VALID: {only nodes} => the other lists still default to empty', () => {
      handlerResultLayerTransformerProxy();

      expect(handlerResultLayerTransformer({ nodes: [WalkNodeStub()] })).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        nodes: [WalkNodeStub()],
        probeSites: [],
        moduleEdges: [],
        declaredShapes: [],
        globalUses: [],
        envReads: [],
        reachedFns: [],
        invokedFns: [],
        descents: [],
      });
    });
  });

  describe('opensScope', () => {
    it('VALID: {opensScope given} => carried through', () => {
      handlerResultLayerTransformerProxy();

      expect(handlerResultLayerTransformer({ opensScope: ScopeRecordStub() })).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        nodes: [],
        probeSites: [],
        moduleEdges: [],
        declaredShapes: [],
        globalUses: [],
        envReads: [],
        reachedFns: [],
        invokedFns: [],
        descents: [],
        opensScope: ScopeRecordStub(),
      });
    });

    it('EMPTY: {opensScope omitted} => the key is ABSENT rather than undefined', () => {
      handlerResultLayerTransformerProxy();

      expect('opensScope' in handlerResultLayerTransformer({})).toBe(false);
    });
  });
});

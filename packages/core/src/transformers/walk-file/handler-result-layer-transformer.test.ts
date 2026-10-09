import { FallthroughArmStub } from '../../contracts/fallthrough-arm/fallthrough-arm.stub';
import { IndexDemandStub } from '../../contracts/index-demand/index-demand.stub';
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
        indexDemands: [],
        fallthroughArms: [],
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
        indexDemands: [],
        fallthroughArms: [],
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

    it('VALID: {indexDemands given} => carried through', () => {
      handlerResultLayerTransformerProxy();
      const demand = IndexDemandStub();

      expect(handlerResultLayerTransformer({ indexDemands: [demand] })).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        indexDemands: [demand],
        fallthroughArms: [],
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

    it('VALID: {fallthroughArms given} => carried through', () => {
      handlerResultLayerTransformerProxy();
      const arm = FallthroughArmStub();

      expect(handlerResultLayerTransformer({ fallthroughArms: [arm] })).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        indexDemands: [],
        fallthroughArms: [arm],
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
  });

  describe('implicitScopes', () => {
    it('VALID: {one implicit scope given} => carried through', () => {
      handlerResultLayerTransformerProxy();
      const implicit = handlerResultLayerTransformer({ opensScope: ScopeRecordStub() });

      expect(handlerResultLayerTransformer({ implicitScopes: [implicit] })).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        indexDemands: [],
        fallthroughArms: [],
        nodes: [],
        probeSites: [],
        moduleEdges: [],
        declaredShapes: [],
        globalUses: [],
        envReads: [],
        reachedFns: [],
        invokedFns: [],
        descents: [],
        implicitScopes: [implicit],
      });
    });

    it('EMPTY: {no implicit scopes given} => the field is left out, as an absent opensScope is', () => {
      handlerResultLayerTransformerProxy();

      expect(handlerResultLayerTransformer({ implicitScopes: [] })).toStrictEqual({
        branches: [],
        exits: [],
        calls: [],
        valueUses: [],
        exportedBindings: [],
        indexDemands: [],
        fallthroughArms: [],
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
        indexDemands: [],
        fallthroughArms: [],
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

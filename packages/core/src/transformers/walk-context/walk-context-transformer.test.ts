import { GuardStepStub, ParamDescriptorStub, SymbolNameStub } from '@assayer/shared/contracts';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { walkContextTransformer } from './walk-context-transformer';

describe('walkContextTransformer', () => {
  describe('entering a branch arm', () => {
    it('VALID: {guardStep} => appends the step and leaves the scope path alone', () => {
      const context = WalkContextStub({ scopePath: ['classify'], guardPath: [] });
      const guardStep = GuardStepStub({ branchCoverageId: 'classify/if:id:value', arm: 'then' });

      const result = walkContextTransformer({ context, guardSteps: [guardStep] });

      expect(result).toStrictEqual(
        WalkContextStub({
          scopePath: ['classify'],
          guardPath: [{ branchCoverageId: 'classify/if:id:value', arm: 'then' }],
        }),
      );
    });

    it('VALID: {guardStep onto an existing path} => appends in order (nesting is linearized)', () => {
      const context = WalkContextStub({
        guardPath: [{ branchCoverageId: 'classify/if:id:a', arm: 'then' }],
      });
      const guardStep = GuardStepStub({ branchCoverageId: 'classify/if:id:b', arm: 'else' });

      const result = walkContextTransformer({ context, guardSteps: [guardStep] });

      expect(result.guardPath).toStrictEqual([
        { branchCoverageId: 'classify/if:id:a', arm: 'then' },
        { branchCoverageId: 'classify/if:id:b', arm: 'else' },
      ]);
    });
  });

  describe('entering a scope', () => {
    it('VALID: {scopeSegment} => extends the scope path', () => {
      const context = WalkContextStub({ scopePath: ['Classifier'] });

      const result = walkContextTransformer({
        context,
        scopeSegment: SymbolNameStub({ value: 'classify' }),
        params: [],
        exported: true,
      });

      expect(result.scopePath).toStrictEqual(['Classifier', 'classify']);
    });

    it('VALID: {scopeSegment inside a guarded arm} => RESETS the guard path', () => {
      const context = WalkContextStub({
        scopePath: ['outer'],
        guardPath: [{ branchCoverageId: 'outer/if:id:flag', arm: 'then' }],
      });

      const result = walkContextTransformer({
        context,
        scopeSegment: SymbolNameStub({ value: 'inner' }),
        params: [],
        exported: false,
      });

      expect(result).toStrictEqual(
        WalkContextStub({ scopePath: ['outer', 'inner'], guardPath: [], params: [], exported: false }),
      );
    });

    it('VALID: {params} => replaces the enclosing scope params', () => {
      const context = WalkContextStub({ params: [{ name: 'value', type: { kind: 'number' } }] });
      const params = [ParamDescriptorStub({ name: 'name', type: { kind: 'string' } })];

      const result = walkContextTransformer({ context, scopeSegment: SymbolNameStub({ value: 'inner' }), params });

      expect(result.params).toStrictEqual([{ name: 'name', type: { kind: 'string' } }]);
    });
  });

  describe('carrying context through', () => {
    it('EMPTY: {no deltas} => returns an equal context', () => {
      const context = WalkContextStub({
        guardPath: [{ branchCoverageId: 'classify/if:id:value', arm: 'then' }],
      });

      const result = walkContextTransformer({ context });

      expect(result).toStrictEqual(context);
    });

    it('VALID: {guardStep} => does not mutate the context passed in', () => {
      const context = WalkContextStub({ guardPath: [] });
      const guardStep = GuardStepStub({ branchCoverageId: 'classify/if:id:value', arm: 'then' });

      walkContextTransformer({ context, guardSteps: [guardStep] });

      expect(context.guardPath).toStrictEqual([]);
    });
  });
});

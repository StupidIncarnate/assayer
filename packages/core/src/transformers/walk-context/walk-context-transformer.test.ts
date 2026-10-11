import { GuardStepStub } from '@assayer/shared/contracts/guard-step/guard-step.stub';
import { ParamDescriptorStub } from '@assayer/shared/contracts/param-descriptor/param-descriptor.stub';
import { ValueExprStub } from '@assayer/shared/contracts/value-expr/value-expr.stub';

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
        scopeSegment: 'classify',
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
        scopeSegment: 'inner',
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

      const result = walkContextTransformer({ context, scopeSegment: 'inner', params });

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

  describe('the tracked bindings', () => {
    it('VALID: {an arm and no new bindings} => the arm starts from the bindings the walk carried', () => {
      const context = WalkContextStub({ bindings: { '12': ValueExprStub({ kind: 'param', name: 'n' }) } });

      const result = walkContextTransformer({ context, guardSteps: [GuardStepStub()] });

      expect(result.bindings).toStrictEqual({ '12': ValueExprStub({ kind: 'param', name: 'n' }) });
    });

    it('VALID: {new bindings} => replace the carried ones for the following statements', () => {
      const context = WalkContextStub({ bindings: { '12': ValueExprStub({ kind: 'param', name: 'n' }) } });

      const result = walkContextTransformer({
        context,
        bindings: { '12': ValueExprStub({ kind: 'lit', value: 'b' }) },
      });

      expect(result.bindings).toStrictEqual({ '12': ValueExprStub({ kind: 'lit', value: 'b' }) });
    });

    it('VALID: {entering a scope} => starts again with none, even when bindings are passed', () => {
      const context = WalkContextStub({ bindings: { '12': ValueExprStub({ kind: 'param', name: 'n' }) } });

      const result = walkContextTransformer({
        context,
        scopeSegment: 'inner',
        bindings: { '12': ValueExprStub({ kind: 'lit', value: 'b' }) },
      });

      expect(result).toStrictEqual(WalkContextStub({ scopePath: [...context.scopePath, 'inner'], guardPath: [], tail: true }));
    });

    it('EMPTY: {empty bindings} => the key is omitted, so the context equals one that never had it', () => {
      const context = WalkContextStub({ bindings: { '12': ValueExprStub({ kind: 'param', name: 'n' }) } });

      const result = walkContextTransformer({ context, bindings: {} });

      expect(result).toStrictEqual(WalkContextStub());
    });
  });
});

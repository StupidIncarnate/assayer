import { ConditionLeafStub, ParamDescriptorStub, TypeDescriptorStub } from '@assayer/shared/contracts';

import { causeArrangeTransformer } from './cause-arrange-transformer';

const SCORE_LEAF = ConditionLeafStub({
  id: 'x#leaf.0',
  operandParamName: 'score',
  operandType: { kind: 'number' },
  predicate: { kind: 'gt', literal: 5 },
});
const BONUS_LEAF = ConditionLeafStub({
  id: 'x#leaf.1',
  operandParamName: 'bonus',
  operandType: { kind: 'number' },
  predicate: { kind: 'gt', literal: 1 },
});

const NUMBER_PARAMS = [
  ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
  ParamDescriptorStub({ name: 'bonus', type: { kind: 'number' } }),
];

describe('causeArrangeTransformer', () => {
  describe('binding requirements to values', () => {
    it('VALID: {two operands, both wanted} => one arrangement satisfying both', () => {
      const result = causeArrangeTransformer({
        requirements: [
          { leaf: SCORE_LEAF, want: true },
          { leaf: BONUS_LEAF, want: true },
        ],
        params: NUMBER_PARAMS,
      });

      expect(result).toStrictEqual([
        [
          { param: 'score', value: 6 },
          { param: 'bonus', value: 2 },
        ],
      ]);
    });

    it('VALID: {want false} => the VIOLATING value, which is how negation is realized', () => {
      const result = causeArrangeTransformer({
        requirements: [{ leaf: SCORE_LEAF, want: false }],
        params: NUMBER_PARAMS,
      });

      expect(result).toStrictEqual([
        [
          { param: 'score', value: 5 },
          // bonus is unconstrained by this cause, so it falls to representative fill.
          { param: 'bonus', value: 0 },
        ],
      ]);
    });
  });

  describe('a multi-valued operand fans out', () => {
    it('VALID: {eq on a 3-member union, want false} => one arrangement per other member', () => {
      const unionType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'a' }),
          TypeDescriptorStub({ kind: 'literal', value: 'b' }),
          TypeDescriptorStub({ kind: 'literal', value: 'c' }),
        ],
      });

      const result = causeArrangeTransformer({
        requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'x#leaf',
              operandParamName: 'status',
              operandType: unionType,
              predicate: { kind: 'eq', literal: 'a' },
            }),
            want: false,
          },
        ],
        params: [ParamDescriptorStub({ name: 'status', type: unionType })],
      });

      expect(result).toStrictEqual([[{ param: 'status', value: 'b' }], [{ param: 'status', value: 'c' }]]);
    });
  });

  describe('same-operand requirements INTERSECT', () => {
    it('VALID: {two eq-else steps on one union discriminant} => the single uncovered member', () => {
      const unionType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          TypeDescriptorStub({ kind: 'literal', value: 'post' }),
          TypeDescriptorStub({ kind: 'literal', value: 'delete' }),
        ],
      });

      const result = causeArrangeTransformer({
        requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'g#leaf',
              operandParamName: 'method',
              operandType: unionType,
              predicate: { kind: 'eq', literal: 'get' },
            }),
            want: false,
          },
          {
            leaf: ConditionLeafStub({
              id: 'p#leaf',
              operandParamName: 'method',
              operandType: unionType,
              predicate: { kind: 'eq', literal: 'post' },
            }),
            want: false,
          },
        ],
        params: [ParamDescriptorStub({ name: 'method', type: unionType })],
      });

      expect(result).toStrictEqual([[{ param: 'method', value: 'delete' }]]);
    });

    it('EDGE: {contradictory requirements on one operand} => representative fill, so the exit still yields a case', () => {
      const result = causeArrangeTransformer({
        requirements: [
          { leaf: SCORE_LEAF, want: true },
          {
            leaf: ConditionLeafStub({
              id: 'x#leaf.9',
              operandParamName: 'score',
              operandType: { kind: 'number' },
              predicate: { kind: 'lt', literal: 3 },
            }),
            want: true,
          },
        ],
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
      });

      expect(result).toStrictEqual([[{ param: 'score', value: 0 }]]);
    });
  });

  describe('operands that cannot be arranged', () => {
    it('EDGE: {a leaf with no operand name} => it constrains nothing and the param falls to fill', () => {
      const result = causeArrangeTransformer({
        requirements: [
          {
            leaf: ConditionLeafStub({ id: 'x#leaf', operandType: { kind: 'boolean' }, predicate: { kind: 'truthy' } }),
            want: true,
          },
        ],
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
      });

      expect(result).toStrictEqual([[{ param: 'score', value: 0 }]]);
    });

    it('EMPTY: {no requirements, no params} => a single empty arrangement', () => {
      expect(causeArrangeTransformer({ requirements: [], params: [] })).toStrictEqual([[]]);
    });
  });
});

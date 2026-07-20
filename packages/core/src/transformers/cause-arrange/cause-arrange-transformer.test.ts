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

// The env shape: a module-scope local bound to `Number(process.env.VALUE)`, so the operand is named
// `value` in the program and `VALUE` in the environment.
const ENV_LEAF = ConditionLeafStub({
  id: 'm#leaf',
  operandParamName: 'value',
  operandEnvVarName: 'VALUE',
  operandType: { kind: 'number' },
  predicate: { kind: 'gt', literal: 5 },
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
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [
          [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'param', param: 'bonus', value: 2 },
          ],
        ],
      });
    });

    it('VALID: {want false} => the VIOLATING value, which is how negation is realized', () => {
      const result = causeArrangeTransformer({
        requirements: [{ leaf: SCORE_LEAF, want: false }],
        params: NUMBER_PARAMS,
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [
          [
            { kind: 'param', param: 'score', value: 5 },
            // bonus is unconstrained by this cause, so it falls to representative fill.
            { kind: 'param', param: 'bonus', value: 7 },
          ],
        ],
      });
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
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [
          [{ kind: 'param', param: 'status', value: 'b' }],
          [{ kind: 'param', param: 'status', value: 'c' }],
        ],
      });
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
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [[{ kind: 'param', param: 'method', value: 'delete' }]],
      });
    });

    // THE case the domain model exists for. Two bounds that OVERLAP have to yield a value inside the
    // overlap: sampling each predicate first lands on 100 and 11, which share no member, and the fill
    // that stood in for them reached a different exit and failed a case against correct code.
    it('VALID: {<= 100 and > 10 on one operand} => a value inside the band, not a fill', () => {
      const result = causeArrangeTransformer({
        requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'b#leaf.0',
              operandParamName: 'size',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 100 },
            }),
            want: false,
          },
          {
            leaf: ConditionLeafStub({
              id: 'b#leaf.1',
              operandParamName: 'size',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 10 },
            }),
            want: true,
          },
        ],
        params: [ParamDescriptorStub({ name: 'size', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [[{ kind: 'param', param: 'size', value: 100 }]],
      });
    });

    // Contradictory requirements are reported, never filled. A fill would have to come from somewhere
    // other than the guards, so its case reaches a different exit and reads as an Assayer bug rather
    // than as the dead branch it is.
    it('EDGE: {contradictory requirements on one operand} => unreachable, with no arrangement', () => {
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
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: true, arrangements: [] });
    });
  });

  describe('an operand read from the environment', () => {
    // The whole feature in one assertion: a module scope has no params, so this arrangement would be
    // EMPTY without the env binding — and two empty arrangements claiming different exits is the
    // self-contradiction that made top-level branching undrivable.
    it('VALID: {env operand, want true, envDrivable} => sets the variable to the inverse of the coercion', () => {
      const result = causeArrangeTransformer({
        requirements: [{ leaf: ENV_LEAF, want: true }],
        params: [],
        envDrivable: true,
      });

      // `6` is what the domain engine picked for `> 5`; `'6'` is what the environment can hold, and
      // `Number('6')` is 6 again — which is why the rung stops at the one coercion with an inverse.
      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [[{ kind: 'env', name: 'VALUE', value: '6' }]],
      });
    });

    it('VALID: {env operand, want false} => the violating value, so the other arm is chosen', () => {
      const result = causeArrangeTransformer({
        requirements: [{ leaf: ENV_LEAF, want: false }],
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [[{ kind: 'env', name: 'VALUE', value: '5' }]],
      });
    });

    // Reading the environment is a fact about the CODE; being driven by it is a fact about the ENTRY.
    // A function captured this binding when its module loaded, so writing the variable before calling
    // it changes nothing — and a case claiming otherwise would fail against correct code.
    it('VALID: {env operand, NOT envDrivable} => no env binding, because calling cannot re-read it', () => {
      const result = causeArrangeTransformer({
        requirements: [{ leaf: ENV_LEAF, want: true }],
        params: [],
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: false, arrangements: [[]] });
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
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [[{ kind: 'param', param: 'score', value: 7 }]],
      });
    });

    // An UNREAD predicate must never make a path look impossible: the reader would be told to delete
    // code the analyzer simply could not follow. Unrecognized constrains nothing, so it fills.
    it('EDGE: {an unrecognized predicate} => reachable, filled from the type', () => {
      const result = causeArrangeTransformer({
        requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'x#leaf',
              operandParamName: 'score',
              operandType: { kind: 'number' },
              predicate: { kind: 'unrecognized' },
            }),
            want: true,
          },
        ],
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [[{ kind: 'param', param: 'score', value: 7 }]],
      });
    });

    it('EMPTY: {no requirements, no params} => a single empty arrangement', () => {
      expect(causeArrangeTransformer({ requirements: [], params: [], envDrivable: false })).toStrictEqual({
        unreachable: false,
        arrangements: [[]],
      });
    });
  });
});

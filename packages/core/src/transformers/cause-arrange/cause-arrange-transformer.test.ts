import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { ParamDescriptorStub } from '@assayer/shared/contracts/param-descriptor/param-descriptor.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { ConditionCauseStub } from '../../contracts/condition-cause/condition-cause.stub';
import { IndexDemandStub } from '../../contracts/index-demand/index-demand.stub';

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
  operandEnvSteps: [{ kind: 'number' }],
  operandType: { kind: 'number' },
  predicate: { kind: 'gt', literal: 5 },
});

// `const cond = Number(process.env.COND); if (cond)`: a bare truthiness read of a coerced number.
const ENV_TRUTHY_LEAF = ConditionLeafStub({
  id: 'm#leaf',
  operandParamName: 'cond',
  operandEnvVarName: 'COND',
  operandEnvSteps: [{ kind: 'number' }],
  operandType: { kind: 'number' },
  predicate: { kind: 'truthy' },
});

// `const flag = process.env.FLAG === 'true'; if (flag)`: a boolean built by comparing the string.
const ENV_FLAG_LEAF = ConditionLeafStub({
  id: 'm#leaf',
  operandParamName: 'flag',
  operandEnvVarName: 'FLAG',
  operandEnvSteps: [{ kind: 'equals', literal: 'true', negated: false }],
  operandType: { kind: 'boolean' },
  predicate: { kind: 'truthy' },
});

// `const items = (process.env.ITEMS ?? '').split(',').map(Number); if (items.length)`.
const ENV_LIST_LEAF = ConditionLeafStub({
  id: 'm#leaf',
  operandParamName: 'items',
  operandEnvVarName: 'ITEMS',
  operandEnvSteps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }, { kind: 'map' }],
  operandType: { kind: 'array', element: { kind: 'unknown', text: 'unknown' } },
  predicate: { kind: 'length-neq', literal: 0 },
});

// `const text = process.env.TEXT ?? ''; if (text.length > 2)`.
const ENV_TEXT_LEAF = ConditionLeafStub({
  id: 'm#leaf',
  operandParamName: 'text',
  operandEnvVarName: 'TEXT',
  operandEnvSteps: [{ kind: 'default', value: '' }],
  operandType: { kind: 'string' },
  predicate: { kind: 'length-gt', literal: 2 },
});

// `process.env.VALUE === undefined`, read in place: the raw read compared with the global undefined.
const ENV_UNSET_TEST_LEAF = ConditionLeafStub({
  id: 'm#leaf.a',
  operandParamName: 'process.env.VALUE',
  operandEnvVarName: 'VALUE',
  operandType: { kind: 'string' },
  predicate: { kind: 'undefined-eq' },
});

// `const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE); if (value ?? 0)`.
const ENV_GUARDED_LEAF = ConditionLeafStub({
  id: 'm#leaf.b',
  operandParamName: 'value',
  operandEnvVarName: 'VALUE',
  operandEnvSteps: [{ kind: 'guard' }, { kind: 'number' }],
  operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
  predicate: { kind: 'truthy' },
});

// `const value = Number(process.env.VALUE); if (value === 7)`.
const ENV_NUMBER_EQ_LEAF = ConditionLeafStub({
  id: 'm#leaf.c',
  operandParamName: 'value',
  operandEnvVarName: 'VALUE',
  operandEnvSteps: [{ kind: 'number' }],
  operandType: { kind: 'number' },
  predicate: { kind: 'eq', literal: 7 },
});

// `process.env.VALUE !== '7'`, read in place.
const ENV_RAW_NEQ_LEAF = ConditionLeafStub({
  id: 'm#leaf.d',
  operandParamName: 'process.env.VALUE',
  operandEnvVarName: 'VALUE',
  operandType: { kind: 'string' },
  predicate: { kind: 'neq', literal: '7' },
});

const NUMBER_PARAMS = [
  ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
  ParamDescriptorStub({ name: 'bonus', type: { kind: 'number' } }),
];

describe('causeArrangeTransformer', () => {
  describe('binding requirements to values', () => {
    // 7 is the number representative. The violating arm of `=== 7` excludes it and names no other
    // value, so the arm realizes the next representative rather than the 7 it excludes.
    it('VALID: {score === 7, want false} => 8, never the excluded 7', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({
          requirements: [
            {
              leaf: ConditionLeafStub({
                id: 'x#leaf',
                operandParamName: 'score',
                operandType: { kind: 'number' },
                predicate: { kind: 'eq', literal: 7 },
              }),
              want: false,
            },
          ],
        }),
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'score', value: 8 }]],
      });
    });

    it('VALID: {value truthy on boolean | undefined} => true, the member the falsy exclusion leaves', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({
          requirements: [
            {
              leaf: ConditionLeafStub({
                id: 'x#leaf',
                operandParamName: 'value',
                operandType: {
                  kind: 'union',
                  members: [
                    { kind: 'unknown', text: 'undefined' },
                    { kind: 'literal', value: false },
                    { kind: 'literal', value: true },
                  ],
                },
                predicate: { kind: 'truthy' },
              }),
              want: true,
            },
          ],
        }),
        params: [
          ParamDescriptorStub({
            name: 'value',
            type: {
              kind: 'union',
              members: [
                { kind: 'unknown', text: 'undefined' },
                { kind: 'literal', value: false },
                { kind: 'literal', value: true },
              ],
            },
          }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'value', value: true }]],
      });
    });

    it('VALID: {two operands, both wanted} => one arrangement satisfying both', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
          { leaf: SCORE_LEAF, want: true },
          { leaf: BONUS_LEAF, want: true },
        ] }),
        params: NUMBER_PARAMS,
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
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
        ...ConditionCauseStub({ requirements: [{ leaf: SCORE_LEAF, want: false }] }),
        params: NUMBER_PARAMS,
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
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
        ...ConditionCauseStub({ requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'x#leaf',
              operandParamName: 'status',
              operandType: unionType,
              predicate: { kind: 'eq', literal: 'a' },
            }),
            want: false,
          },
        ] }),
        params: [ParamDescriptorStub({ name: 'status', type: unionType })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
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
        ...ConditionCauseStub({ requirements: [
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
        ] }),
        params: [ParamDescriptorStub({ name: 'method', type: unionType })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'method', value: 'delete' }]],
      });
    });

    // THE case the domain model exists for. Two bounds that OVERLAP have to yield a value inside the
    // overlap: sampling each predicate first lands on 100 and 11, which share no member, and the fill
    // that stood in for them reached a different exit and failed a case against correct code.
    it('VALID: {<= 100 and > 10 on one operand} => a value inside the band, not a fill', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
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
        ] }),
        params: [ParamDescriptorStub({ name: 'size', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'size', value: 100 }]],
      });
    });

    // Contradictory requirements are reported, never filled. A fill would have to come from somewhere
    // other than the guards, so its case reaches a different exit and reads as an Assayer bug rather
    // than as the dead branch it is.
    it('EDGE: {contradictory requirements on one operand} => unreachable, with no arrangement', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
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
        ] }),
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: true, unfillable: [], arrangements: [] });
    });
  });

  // A WELDED operand seeds a single-value domain the guard's arm values then intersect onto — the
  // analyzer EVALUATES it rather than treating it as a case-set input.
  describe('an operand welded to a same-file constant', () => {
    const CONST_LEAF = ConditionLeafStub({
      id: 'x#leaf',
      operandParamName: 'level',
      operandConstValue: 7,
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    });

    it('VALID: {const 7, guard > 5, want true} => the live arm arranges the constant itself', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: CONST_LEAF, want: true }] }),
        params: [ParamDescriptorStub({ name: 'level', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'level', value: 7 }]],
      });
    });

    it('EDGE: {const 7, guard > 5, want false} => unreachable, since 7 cannot violate its own guard', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: CONST_LEAF, want: false }] }),
        params: [ParamDescriptorStub({ name: 'level', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: true, unfillable: [], arrangements: [] });
    });

    // The array twin: a const array's LENGTH seeds the domain the length guard intersects onto.
    it('EDGE: {const array of length 2, guard length===5} => unreachable, the length can never satisfy it', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'y#leaf',
              operandParamName: 'xs',
              operandConstLength: 2,
              operandType: { kind: 'array', element: { kind: 'number' } },
              predicate: { kind: 'length-eq', literal: 5 },
            }),
            want: true,
          },
        ] }),
        params: [ParamDescriptorStub({ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: true, unfillable: [], arrangements: [] });
    });
  });

  // Distinct operands multiply, not zip: two operands each fanning out to two remaining union members
  // must cross into all four combinations.
  describe('two distinct multi-valued operands', () => {
    it('VALID: {two 3-member unions, both eq-else} => the full four-way cartesian product', () => {
      const statusType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'a' }),
          TypeDescriptorStub({ kind: 'literal', value: 'b' }),
          TypeDescriptorStub({ kind: 'literal', value: 'c' }),
        ],
      });
      const methodType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          TypeDescriptorStub({ kind: 'literal', value: 'post' }),
          TypeDescriptorStub({ kind: 'literal', value: 'delete' }),
        ],
      });

      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
          {
            leaf: ConditionLeafStub({ id: 's#leaf', operandParamName: 'status', operandType: statusType, predicate: { kind: 'eq', literal: 'a' } }),
            want: false,
          },
          {
            leaf: ConditionLeafStub({ id: 'm#leaf', operandParamName: 'method', operandType: methodType, predicate: { kind: 'eq', literal: 'get' } }),
            want: false,
          },
        ] }),
        params: [ParamDescriptorStub({ name: 'status', type: statusType }), ParamDescriptorStub({ name: 'method', type: methodType })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [
            { kind: 'param', param: 'status', value: 'b' },
            { kind: 'param', param: 'method', value: 'post' },
          ],
          [
            { kind: 'param', param: 'status', value: 'b' },
            { kind: 'param', param: 'method', value: 'delete' },
          ],
          [
            { kind: 'param', param: 'status', value: 'c' },
            { kind: 'param', param: 'method', value: 'post' },
          ],
          [
            { kind: 'param', param: 'status', value: 'c' },
            { kind: 'param', param: 'method', value: 'delete' },
          ],
        ],
      });
    });
  });

  describe('an operand read from the environment', () => {
    // The whole feature in one assertion: a module scope has no params, so this arrangement would be
    // EMPTY without the env binding — and two empty arrangements claiming different exits is the
    // self-contradiction that made top-level branching undrivable.
    it('VALID: {env operand, want true, envDrivable} => sets the variable to the inverse of the coercion', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_LEAF, want: true }] }),
        params: [],
        envDrivable: true,
      });

      // `6` is what the domain engine picked for `> 5`; `'6'` is what the environment can hold, and
      // `Number('6')` is 6 again — which is why the rung stops at the one coercion with an inverse.
      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'VALUE', value: '6' }]],
      });
    });

    it('VALID: {env operand, want false} => the violating value, so the other arm is chosen', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_LEAF, want: false }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'VALUE', value: '5' }]],
      });
    });

    // Reading the environment is a fact about the CODE; being driven by it is a fact about the ENTRY.
    // A function captured this binding when its module loaded, so writing the variable before calling
    // it changes nothing — and a case claiming otherwise would fail against correct code.
    it('VALID: {env operand, NOT envDrivable} => no env binding, because calling cannot re-read it', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_LEAF, want: true }] }),
        params: [],
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: [], arrangements: [[]] });
    });

    // "Anything but 0" names no value of its own. The number representative 7 is one it admits, so the
    // truthy arm still writes a variable, exactly as a param's fill would hand it 7. With no variable
    // written, `Number(undefined)` is NaN, which is falsy, and the case would reach the other arm.
    it('VALID: {Number env operand, truthy wanted} => the representative 7, written as a string', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_TRUTHY_LEAF, want: true }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'COND', value: '7' }]],
      });
    });

    it('VALID: {Number env operand, falsy wanted} => "0"', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_TRUTHY_LEAF, want: false }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'COND', value: '0' }]],
      });
    });

    it("VALID: {=== 'true' env operand, true wanted} => the compared literal itself", () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_FLAG_LEAF, want: true }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'FLAG', value: 'true' }]],
      });
    });

    it("VALID: {=== 'true' env operand, false wanted} => a string other than the literal", () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_FLAG_LEAF, want: false }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'FLAG', value: 'abc123' }]],
      });
    });

    it('VALID: {split env list, non-empty wanted} => one item', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_LIST_LEAF, want: true }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'ITEMS', value: 'a' }]],
      });
    });

    // `''.split(',')` is `['']`, so no environment empties a split list: that arm is unreachable.
    it('VALID: {split env list, empty wanted} => unreachable, since a split list always holds an item', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_LIST_LEAF, want: false }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({ unreachable: true, unfillable: [], arrangements: [] });
    });

    it('VALID: {env string, length over 2 wanted} => a three-character string', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_TEXT_LEAF, want: true }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'TEXT', value: 'abc' }]],
      });
    });

    // The shortest length the arm admits is 0, the `''` fallback itself, and leaving TEXT unset is the
    // input that runs that fallback.
    it("VALID: {env string, length of 2 or less wanted} => TEXT left unset, the input that runs the ?? '' fallback", () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_TEXT_LEAF, want: false }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'TEXT' }]],
      });
    });

    it('VALID: {process.env.VALUE === undefined, read in place, wanted true} => VALUE left unset', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: ENV_UNSET_TEST_LEAF, want: true }] }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'VALUE' }]],
      });
    });

    it('VALID: {process.env.VALUE === undefined wanted false, the guarded value truthy} => one VALUE both reads agree on', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({
          requirements: [
            { leaf: ENV_UNSET_TEST_LEAF, want: false },
            { leaf: ENV_GUARDED_LEAF, want: true },
          ],
        }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'VALUE', value: '7' }]],
      });
    });

    it('VALID: {process.env.VALUE === undefined wanted true, the guarded value falsy} => VALUE left unset, which both reads accept', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({
          requirements: [
            { leaf: ENV_UNSET_TEST_LEAF, want: true },
            { leaf: ENV_GUARDED_LEAF, want: false },
          ],
        }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'env', name: 'VALUE' }]],
      });
    });

    // An unset VALUE leaves the guarded value undefined, which is falsy, so no input meets both reads.
    it('INVALID: {process.env.VALUE === undefined wanted true, the guarded value truthy} => unreachable', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({
          requirements: [
            { leaf: ENV_UNSET_TEST_LEAF, want: true },
            { leaf: ENV_GUARDED_LEAF, want: true },
          ],
        }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({ unreachable: true, unfillable: [], arrangements: [] });
    });

    // '7' meets `Number(VALUE) === 7` and fails `VALUE !== '7'`, and the string representative fails the
    // other way. Another string ('07') would meet both, so the case is dropped without calling it dead.
    it("EDGE: {Number(VALUE) === 7 and VALUE !== '7'} => no arrangement, and not unreachable", () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({
          requirements: [
            { leaf: ENV_NUMBER_EQ_LEAF, want: true },
            { leaf: ENV_RAW_NEQ_LEAF, want: true },
          ],
        }),
        params: [],
        envDrivable: true,
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: [], arrangements: [] });
    });

    // envDrivable alone is not enough — a leaf with no `operandEnvVarName` names no environment
    // variable, so a plain param stays a param binding even when the entry it belongs to is a module
    // scope the environment could otherwise drive.
    it('VALID: {envDrivable, but the leaf names no env var} => a plain param binding, no env binding added', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: SCORE_LEAF, want: true }] }),
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
        envDrivable: true,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'score', value: 6 }]],
      });
    });
  });

  describe('operands that cannot be arranged', () => {
    it('EDGE: {a leaf with no operand name} => it constrains nothing and the param falls to fill', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
          {
            leaf: ConditionLeafStub({ id: 'x#leaf', operandType: { kind: 'boolean' }, predicate: { kind: 'truthy' } }),
            want: true,
          },
        ] }),
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'score', value: 7 }]],
      });
    });

    // An UNREAD predicate must never make a path look impossible: the reader would be told to delete
    // code the analyzer simply could not follow. Unrecognized constrains nothing, so it fills.
    it('EDGE: {an unrecognized predicate} => reachable, filled from the type', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
          {
            leaf: ConditionLeafStub({
              id: 'x#leaf',
              operandParamName: 'score',
              operandType: { kind: 'number' },
              predicate: { kind: 'unrecognized' },
            }),
            want: true,
          },
        ] }),
        params: [ParamDescriptorStub({ name: 'score', type: { kind: 'number' } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'param', param: 'score', value: 7 }]],
      });
    });

    it('EMPTY: {no requirements, no params} => a single empty arrangement', () => {
      expect(causeArrangeTransformer({ requirements: [], params: [], envDrivable: false })).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[]],
      });
    });
  });

  // The refusal, and it is deliberately NOT `unreachable`: nothing here is dead code, the input is
  // simply one Assayer cannot construct. Merging them would report correct code as a dead-exit lint.
  describe('a param the fill seam refuses', () => {
    it('INVALID: {a callback param beside a steered scalar} => no arrangement, and the param named', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: SCORE_LEAF, want: true }] }),
        params: [
          ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [{ param: 'report', type: '(m: string) => string' }],
        arrangements: [],
      });
    });

    // Contradiction is decided FIRST, so a cause whose guards cannot hold still reports the dead exit
    // rather than being masked by a param it also could not fill.
    it('EDGE: {contradictory guards AND an unfillable param} => unreachable wins, so the lint survives', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [
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
        ] }),
        params: [
          ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'payload', type: { kind: 'unknown', text: 'Map<string, number>' } }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({ unreachable: true, unfillable: [], arrangements: [] });
    });
  });

  describe('an object param is BUILT', () => {
    // The shape the reader enumerated is filled out rather than discarded — a nested property gets a
    // nested value, which is what makes `config.db.host` a real input instead of a string placeholder.
    it('VALID: {an unconstrained nested object param} => one arrangement carrying the built object', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [
          ParamDescriptorStub({
            name: 'config',
            type: {
              kind: 'object',
              typeName: 'Config',
              properties: [
                { name: 'db', type: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] } },
                { name: 'mode', type: { kind: 'string' } },
              ],
            },
          }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'object', param: 'config', value: { db: { host: 'abc123' }, mode: 'abc123' } }]],
      });
    });
  });

  describe('an array param fans out over cardinality', () => {
    // A scalar fill hands the string placeholder to code that operates on the array (`items.pop()`),
    // which throws — so an array param falls to `array-arrange` and fans out over its size classes:
    // empty (`[]`) leads as the salient representative, then one (`[7]`), then many (`[7,7]`). Each is
    // an `array` binding, set positionally like any argument.
    it('VALID: {an unconstrained number[] param} => three array bindings, empty/one/many, not a string fill', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [ParamDescriptorStub({ name: 'items', type: { kind: 'array', element: { kind: 'number' } } })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [{ kind: 'array', param: 'items', value: [] }],
          [{ kind: 'array', param: 'items', value: [7] }],
          [{ kind: 'array', param: 'items', value: [7, 8] }],
        ],
      });
    });

    // The array fan-out cross-products with the scalar operand cartesian: one constrained scalar (fixed
    // at its domain value) times the three cardinalities is three arrangements, the scalar constant
    // across them.
    it('VALID: {a constrained scalar beside an array param} => the scalar value crossed with each cardinality', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: SCORE_LEAF, want: true }] }),
        params: [
          ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }),
        ],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'array', param: 'items', value: [] },
          ],
          [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'array', param: 'items', value: [7] },
          ],
          [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'array', param: 'items', value: [7, 8] },
          ],
        ],
      });
    });

    // A5: `caseInterpretBroker` applies an `array` binding as ONE positional argument, which is
    // wrong for a REST parameter — its array must SPREAD across the tail positional slots it stands
    // for. The binding carries `rest: true` so the interpreter can tell the two apart; a plain array
    // param (above) carries no such flag.
    it('VALID: {a rest number[] param} => the same cardinality fan-out, each binding marked rest: true', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [ParamDescriptorStub({ name: 'ns', type: { kind: 'array', element: { kind: 'number' } }, rest: true })],
        envDrivable: false,
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [{ kind: 'array', param: 'ns', value: [], rest: true }],
          [{ kind: 'array', param: 'ns', value: [7], rest: true }],
          [{ kind: 'array', param: 'ns', value: [7, 8], rest: true }],
        ],
      });
    });
  });

  describe('a harness supplies what the seam refuses', () => {
    // The refusal being CLOSED: the callback the fill seam has no vocabulary for is named by key path
    // instead, so the cause arranges rather than reporting itself unfillable.
    it('VALID: {a callback param the harness declares} => a harness binding, and nothing refused', () => {
      const result = causeArrangeTransformer({
        ...ConditionCauseStub({ requirements: [{ leaf: SCORE_LEAF, want: true }] }),
        params: [
          ParamDescriptorStub({ name: 'score', type: { kind: 'number' } }),
          ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }),
        ],
        envDrivable: false,
        harness: { entry: 'audit', params: ['report'] },
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [
            { kind: 'param', param: 'score', value: 6 },
            { kind: 'harness', param: 'report', key: 'inputs.audit.report' },
          ],
        ],
      });
    });

    // A harness that supplies only one of two refusals leaves the other refused, so the cause still
    // arranges nothing and the caller re-invoices exactly what remains.
    it('VALID: {one of two callbacks declared} => no arrangement, and only the OTHER is refused', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [
          ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }),
          ParamDescriptorStub({ name: 'emit', type: { kind: 'callable', text: '(n: number) => void' } }),
        ],
        envDrivable: false,
        harness: { entry: 'audit', params: ['report'] },
      });

      expect(result).toStrictEqual({
        unreachable: false,
        arrangements: [],
        unfillable: [{ param: 'emit', type: '(n: number) => void' }],
      });
    });

    // A supplied parameter is ONE argument the human handed over, so it takes no cardinality fan-out
    // even when its declared type is an array: there is no breadth in a value nobody derived.
    it('EDGE: {an array param the harness declares} => one harness binding, not three cardinalities', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [ParamDescriptorStub({ name: 'items', type: { kind: 'array', element: { kind: 'number' } } })],
        envDrivable: false,
        harness: { entry: 'audit', params: ['items'] },
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'harness', param: 'items', key: 'inputs.audit.items' }]],
      });
    });

    // A harness answering a REST parameter carries `rest: true` on the binding itself, the same fact an
    // array binding carries it for — the interpreter needs it to SPREAD the resolved value across the
    // tail positional slots instead of nesting it one level too deep.
    it('EDGE: {a rest array param the harness declares} => the harness binding carries rest: true', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [
          ParamDescriptorStub({
            name: 'sinks',
            type: { kind: 'array', element: { kind: 'callable', text: '(m: string) => void' } },
            rest: true,
          }),
        ],
        envDrivable: false,
        harness: { entry: 'collect', params: ['sinks'] },
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [[{ kind: 'harness', param: 'sinks', key: 'inputs.collect.sinks', rest: true }]],
      });
    });
  });

  describe('index demands generate in-bounds and out-of-bounds cases', () => {
    it('VALID: {at method index demand} => generates 0, -1, 7 for index across empty, single, and multiple array cardinalities', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [
          ParamDescriptorStub({ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }),
          ParamDescriptorStub({ name: 'index', type: { kind: 'number' } }),
        ],
        envDrivable: false,
        indexDemands: [
          IndexDemandStub({ kind: 'param-index', param: 'index', operation: 'at' }),
        ],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [{ kind: 'array', param: 'items', value: [] }, { kind: 'param', param: 'index', value: 0 }],
          [{ kind: 'array', param: 'items', value: [7] }, { kind: 'param', param: 'index', value: 0 }],
          [{ kind: 'array', param: 'items', value: [7, 8] }, { kind: 'param', param: 'index', value: 0 }],
          [{ kind: 'array', param: 'items', value: [] }, { kind: 'param', param: 'index', value: -1 }],
          [{ kind: 'array', param: 'items', value: [7] }, { kind: 'param', param: 'index', value: -1 }],
          [{ kind: 'array', param: 'items', value: [7, 8] }, { kind: 'param', param: 'index', value: -1 }],
          [{ kind: 'array', param: 'items', value: [] }, { kind: 'param', param: 'index', value: 7 }],
          [{ kind: 'array', param: 'items', value: [7] }, { kind: 'param', param: 'index', value: 7 }],
          [{ kind: 'array', param: 'items', value: [7, 8] }, { kind: 'param', param: 'index', value: 7 }],
        ],
      });
    });

    it('VALID: {array-length-index demand} => extends array cardinalities with extra length for out-of-bounds testing', () => {
      const result = causeArrangeTransformer({
        requirements: [],
        params: [
          ParamDescriptorStub({ name: 'arr', type: { kind: 'array', element: { kind: 'number' } } }),
        ],
        envDrivable: false,
        indexDemands: [
          IndexDemandStub({ kind: 'array-length-index', arrayParam: 'arr', targetLength: 3, operation: 'at' }),
        ],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: [],
        arrangements: [
          [{ kind: 'array', param: 'arr', value: [] }],
          [{ kind: 'array', param: 'arr', value: [7] }],
          [{ kind: 'array', param: 'arr', value: [7, 8] }],
          [{ kind: 'array', param: 'arr', value: [7, 8, 9] }],
        ],
      });
    });
  });

  // The general invariant (§G2): a built binding must be a value OF the param it names. Every
  // producer here builds FROM `param.type`, so on correct code this never fires — the scenario below is
  // the one way it legitimately CAN: a leaf's own `operandType` (read by a DIFFERENT reader than the
  // param's declared type) drifting out of agreement with it. `score` is declared `string`, but its
  // condition leaf carries `operandType: number` — a real, reachable shape of drift, not a fabricated
  // bug, since the two are two separate reads of the same operand that nothing currently cross-checks.
  describe('a leaf whose operandType disagrees with its own param\'s declared type', () => {
    const DRIFTED_LEAF = ConditionLeafStub({
      id: 'x#leaf.drift',
      operandParamName: 'score',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    });
    const STRING_SCORE_PARAM = [ParamDescriptorStub({ name: 'score', type: { kind: 'string' } })];

    it('ERROR: {a number-typed domain value bound to a string-declared param} => throws, naming both types', () => {
      expect(() =>
        causeArrangeTransformer({
          ...ConditionCauseStub({ requirements: [{ leaf: DRIFTED_LEAF, want: true }] }),
          params: STRING_SCORE_PARAM,
          envDrivable: false,
        }),
      ).toThrow(
        'cause-arrange built a `param` value for `score` that does not satisfy its own declared type `string`: 6. ' +
          "Assayer contradicted a type it read itself — its own invariant broken, never the reader's debt.",
      );
    });
  });
});

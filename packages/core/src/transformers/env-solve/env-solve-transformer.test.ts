import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { ConditionCauseStub } from '../../contracts/condition-cause/condition-cause.stub';
import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { envSolveTransformer } from './env-solve-transformer';

// `process.env.VALUE === undefined`, read in place: the raw read compared with the global undefined.
const UNSET_TEST_LEAF = ConditionLeafStub({
  id: 'm#leaf.a',
  operandParamName: 'process.env.VALUE',
  operandEnvVarName: 'VALUE',
  operandType: { kind: 'string' },
  predicate: { kind: 'undefined-eq' },
});

// `const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE); if (value ?? 0)`.
const GUARDED_LEAF = ConditionLeafStub({
  id: 'm#leaf.b',
  operandParamName: 'value',
  operandEnvVarName: 'VALUE',
  operandEnvSteps: [{ kind: 'guard' }, { kind: 'number' }],
  operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
  predicate: { kind: 'truthy' },
});

// `const value = Number(process.env.VALUE); if (value === 7)`.
const NUMBER_EQ_LEAF = ConditionLeafStub({
  id: 'm#leaf.c',
  operandParamName: 'value',
  operandEnvVarName: 'VALUE',
  operandEnvSteps: [{ kind: 'number' }],
  operandType: { kind: 'number' },
  predicate: { kind: 'eq', literal: 7 },
});

// `process.env.VALUE !== '7'`, read in place.
const RAW_NEQ_LEAF = ConditionLeafStub({
  id: 'm#leaf.d',
  operandParamName: 'process.env.VALUE',
  operandEnvVarName: 'VALUE',
  operandType: { kind: 'string' },
  predicate: { kind: 'neq', literal: '7' },
});

const UNSET_KEY = 'process.env.VALUE';
const GUARDED_KEY = '(process.env.VALUE === undefined ? undefined : Number(process.env.VALUE))';
const NUMBER_KEY = 'Number(process.env.VALUE)';

describe('envSolveTransformer', () => {
  describe('one read', () => {
    it('VALID: {VALUE === undefined, wants true} => unset', () => {
      const { requirements } = ConditionCauseStub({ requirements: [{ leaf: UNSET_TEST_LEAF, want: true }] });

      const result = envSolveTransformer({ requirements, domains: new Map([[UNSET_KEY, ValueDomainStub({ members: [null] })]]) });

      expect(result).toStrictEqual({ kind: 'unset' });
    });

    it('VALID: {VALUE === undefined, wants false} => the string representative, a set variable', () => {
      const { requirements } = ConditionCauseStub({ requirements: [{ leaf: UNSET_TEST_LEAF, want: false }] });

      const result = envSolveTransformer({ requirements, domains: new Map([[UNSET_KEY, ValueDomainStub({ excluded: [null] })]]) });

      expect(result).toStrictEqual({ kind: 'set', value: 'abc123' });
    });

    it('EMPTY: {a domain no value meets} => unencodable, so no variable is written', () => {
      const { requirements } = ConditionCauseStub({ requirements: [{ leaf: NUMBER_EQ_LEAF, want: true }] });

      const result = envSolveTransformer({ requirements, domains: new Map([[NUMBER_KEY, ValueDomainStub({ members: [] })]]) });

      expect(result).toStrictEqual({ kind: 'unencodable' });
    });
  });

  describe('two reads of one variable', () => {
    it('VALID: {VALUE === undefined wants true, guarded value falsy} => unset meets both', () => {
      const { requirements } = ConditionCauseStub({
        requirements: [
          { leaf: UNSET_TEST_LEAF, want: true },
          { leaf: GUARDED_LEAF, want: false },
        ],
      });

      const result = envSolveTransformer({
        requirements,
        domains: new Map([
          [UNSET_KEY, ValueDomainStub({ members: [null] })],
          [GUARDED_KEY, ValueDomainStub({ members: [0] })],
        ]),
      });

      expect(result).toStrictEqual({ kind: 'unset' });
    });

    it('VALID: {VALUE === undefined wants false, guarded value truthy} => "7", the first candidate both reads meet', () => {
      const { requirements } = ConditionCauseStub({
        requirements: [
          { leaf: UNSET_TEST_LEAF, want: false },
          { leaf: GUARDED_LEAF, want: true },
        ],
      });

      const result = envSolveTransformer({
        requirements,
        domains: new Map([
          [UNSET_KEY, ValueDomainStub({ excluded: [null] })],
          [GUARDED_KEY, ValueDomainStub({ excluded: [0] })],
        ]),
      });

      expect(result).toStrictEqual({ kind: 'set', value: '7' });
    });

    it('INVALID: {VALUE === undefined wants true, guarded value truthy} => unreachable, since unset is falsy', () => {
      const { requirements } = ConditionCauseStub({
        requirements: [
          { leaf: UNSET_TEST_LEAF, want: true },
          { leaf: GUARDED_LEAF, want: true },
        ],
      });

      const result = envSolveTransformer({
        requirements,
        domains: new Map([
          [UNSET_KEY, ValueDomainStub({ members: [null] })],
          [GUARDED_KEY, ValueDomainStub({ excluded: [0] })],
        ]),
      });

      expect(result).toStrictEqual({ kind: 'unreachable' });
    });

    it("EDGE: {Number(VALUE) === 7, VALUE !== '7'} => unsolved, since no candidate meets both and nothing proves none can", () => {
      const { requirements } = ConditionCauseStub({
        requirements: [
          { leaf: NUMBER_EQ_LEAF, want: true },
          { leaf: RAW_NEQ_LEAF, want: true },
        ],
      });

      const result = envSolveTransformer({
        requirements,
        domains: new Map([
          [NUMBER_KEY, ValueDomainStub({ members: [7] })],
          [UNSET_KEY, ValueDomainStub({ excluded: ['7'] })],
        ]),
      });

      expect(result).toStrictEqual({ kind: 'unsolved' });
    });
  });
});

import { ConditionLeafStub, DeclaredTypeStub, PropertyDemandStub, symbolNameContract } from '@assayer/shared/contracts';

import { objectArrangeTransformer } from './object-arrange-transformer';

const modeLeaf = ConditionLeafStub({
  id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['mode'],
  operandTypeRef: 'Config',
  operandType: { kind: 'string' },
  predicate: { kind: 'eq', literal: 'a' },
});

const modeOnly = DeclaredTypeStub({ name: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] });
const modeAndRetries = DeclaredTypeStub({
  name: 'Config',
  properties: [
    { name: 'mode', type: { kind: 'string' } },
    { name: 'retries', type: { kind: 'number' } },
  ],
});

const CONFIG = symbolNameContract.parse('config');

describe('objectArrangeTransformer', () => {
  describe('an uncorrected property (derived demand, non-authoritative)', () => {
    it("VALID: {mode !== 'a', demands ['dev','prod'], no correction} => picks the first demanded value the else side admits", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev', 'prod'] } })],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, properties: [{ name: 'mode', value: 'dev' }] });
    });

    it("VALID: {mode === 'a', demands ['dev','prod'], no correction} => none satisfy, so the then side falls back to the domain's realized value", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev', 'prod'] } })],
        requirements: [{ leaf: modeLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, properties: [{ name: 'mode', value: 'a' }] });
    });
  });

  describe('a corrected property (AUTHORITATIVE — only its corrected values)', () => {
    it("VALID: {mode === 'a', corrected ['a','dev','prod','staging']} => the then arm arranges the corrected 'a' the guard admits", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'dev', 'prod', 'staging'] } })],
        requirements: [{ leaf: modeLeaf, want: true }],
        corrected: [symbolNameContract.parse('mode')],
      });

      expect(result).toStrictEqual({ unreachable: false, properties: [{ name: 'mode', value: 'a' }] });
    });

    it("VALID: {mode !== 'a', corrected ['a','dev','prod','staging']} => the else arm arranges the first corrected non-'a' value", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'dev', 'prod', 'staging'] } })],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [symbolNameContract.parse('mode')],
      });

      expect(result).toStrictEqual({ unreachable: false, properties: [{ name: 'mode', value: 'dev' }] });
    });

    // The authoritative contradiction: no corrected value can make `mode === 'a'` true, so the bucket is
    // unreachable and the caller drops it — no bogus case, no fallback to the branch literal 'a'.
    it("INVALID: {mode === 'a', corrected ['dev','prod'] (none satisfies)} => unreachable, never the branch literal", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev', 'prod'] } })],
        requirements: [{ leaf: modeLeaf, want: true }],
        corrected: [symbolNameContract.parse('mode')],
      });

      expect(result).toStrictEqual({ unreachable: true, properties: [{ name: 'mode', value: 'dev' }] });
    });
  });

  describe('an unconstrained property', () => {
    it('VALID: {retries unread, unknown demand} => the type representative fill, sorted after mode', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndRetries,
        demands: [
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev'] } }),
          PropertyDemandStub({ name: 'retries', demand: { kind: 'unknown' } }),
        ],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        properties: [
          { name: 'mode', value: 'dev' },
          { name: 'retries', value: 7 },
        ],
      });
    });
  });
});

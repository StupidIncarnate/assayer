import { symbolNameContract } from '@assayer/shared/contracts';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { DeclaredTypeStub } from '@assayer/shared/contracts/declared-type/declared-type.stub';
import { PropertyDemandStub } from '@assayer/shared/contracts/property-demand/property-demand.stub';

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
const modeNullable = DeclaredTypeStub({
  name: 'Config',
  properties: [
    {
      name: 'mode',
      type: { kind: 'union', members: [{ kind: 'string' }, { kind: 'literal', value: null }] },
    },
  ],
});
const modeAndRetries = DeclaredTypeStub({
  name: 'Config',
  properties: [
    { name: 'mode', type: { kind: 'string' } },
    { name: 'retries', type: { kind: 'number' } },
  ],
});

const modeAndDb = DeclaredTypeStub({
  name: 'Config',
  properties: [
    { name: 'db', type: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] } },
    { name: 'mode', type: { kind: 'string' } },
  ],
});
const modeAndWrite = DeclaredTypeStub({
  name: 'Config',
  properties: [
    { name: 'mode', type: { kind: 'string' } },
    { name: 'write', type: { kind: 'callable', text: '(line: string) => string' } },
  ],
});

const tagsLengthLeaf = ConditionLeafStub({
  id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:tags,id:length,GreaterThanToken,num:3#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['tags'],
  operandTypeRef: 'Config',
  operandType: { kind: 'array', element: { kind: 'string' } },
  predicate: { kind: 'length-gt', literal: 3 },
});

const modeAndTags = DeclaredTypeStub({
  name: 'Config',
  properties: [
    { name: 'mode', type: { kind: 'string' } },
    { name: 'tags', type: { kind: 'array', element: { kind: 'string' } } },
  ],
});

const dbTruthyLeaf = ConditionLeafStub({
  id: '*module*/decide/if:PropertyAccessExpression,id:config,id:db#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['db'],
  operandTypeRef: 'Config',
  operandType: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] },
  predicate: { kind: 'truthy' },
});

const modeTruthyLeaf = ConditionLeafStub({
  id: '*module*/decide/if:PropertyAccessExpression,id:config,id:mode#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['mode'],
  operandTypeRef: 'Config',
  operandType: { kind: 'string' },
  predicate: { kind: 'truthy' },
});

const tagsTruthyLeaf = ConditionLeafStub({
  id: '*module*/decide/if:PropertyAccessExpression,id:config,id:tags#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['tags'],
  operandTypeRef: 'Config',
  operandType: { kind: 'array', element: { kind: 'string' } },
  predicate: { kind: 'truthy' },
});

const modeNonNullishLeaf = ConditionLeafStub({
  id: '*module*/decide/if:PropertyAccessExpression,id:config,id:mode,QuestionQuestionToken#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['mode'],
  operandTypeRef: 'Config',
  operandType: { kind: 'string' },
  predicate: { kind: 'non-nullish' },
});

const retriesGtLeaf = ConditionLeafStub({
  id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:retries,GreaterThanToken,num:2#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['retries'],
  operandTypeRef: 'Config',
  operandType: { kind: 'number' },
  predicate: { kind: 'gt', literal: 2 },
});

const retriesLtLeaf = ConditionLeafStub({
  id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:config,id:retries,LessThanToken,num:10#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['retries'],
  operandTypeRef: 'Config',
  operandType: { kind: 'number' },
  predicate: { kind: 'lt', literal: 10 },
});

const otherModeLeaf = ConditionLeafStub({
  id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,id:other,id:mode,EqualsEqualsEqualsToken,str:z#leaf',
  operandParamName: 'other',
  operandPropertyPath: ['mode'],
  operandTypeRef: 'Other',
  operandType: { kind: 'string' },
  predicate: { kind: 'eq', literal: 'z' },
});

const nestedModeLeaf = ConditionLeafStub({
  id: '*module*/decide/if:BinaryExpression,PropertyAccessExpression,PropertyAccessExpression,id:config,id:mode,id:sub,EqualsEqualsEqualsToken,str:a#leaf',
  operandParamName: 'config',
  operandPropertyPath: ['mode', 'sub'],
  operandTypeRef: 'Config',
  operandType: { kind: 'string' },
  predicate: { kind: 'eq', literal: 'a' },
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

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'dev' }] });
    });

    it("VALID: {mode === 'a', demands ['dev','prod'], no correction} => none satisfy, so the then side falls back to the domain's realized value", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev', 'prod'] } })],
        requirements: [{ leaf: modeLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'a' }] });
    });

    // Two guards on ONE property intersect to the domain BOTH agree on — the doc's "domain every
    // requirement on it agrees on" claim, otherwise unexercised: with a single requirement the reduce
    // never calls intersectDomainsTransformer at all (its initial accumulator is `undefined`, so the
    // first — and here only — iteration short-circuits to the lone domain untouched).
    it('VALID: {retries > 2 AND retries < 10, both satisfying} => the intersected range, not either bound alone', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: DeclaredTypeStub({ name: 'Config', properties: [{ name: 'retries', type: { kind: 'number' } }] }),
        demands: [],
        requirements: [
          { leaf: retriesGtLeaf, want: true },
          { leaf: retriesLtLeaf, want: true },
        ],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'retries', value: 9 }] });
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

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'a' }] });
    });

    it("VALID: {mode !== 'a', corrected ['a','dev','prod','staging']} => the else arm arranges the first corrected non-'a' value", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'dev', 'prod', 'staging'] } })],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [symbolNameContract.parse('mode')],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'dev' }] });
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

      expect(result).toStrictEqual({ unreachable: true, unfillable: false, properties: [{ name: 'mode', value: 'dev' }] });
    });
  });

  describe('an unconstrained property', () => {
    it('VALID: {retries unread, unknown demand} => the seam fill, sorted after mode', () => {
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
        unfillable: false,
        properties: [
          { name: 'mode', value: 'dev' },
          { name: 'retries', value: 7 },
        ],
      });
    });

    // A demanded `null` is a legitimate value of a `string | null` property, not an absence — it must
    // survive as-is rather than lose to a freshly-built non-null fill.
    it("VALID: {mode: string | null, demand [null], unconstrained} => arranges the demanded null, never the string fill", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeNullable,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: [null] } })],
        requirements: [],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: null }] });
    });

    // A requirement on a SAME-NAMED property of a DIFFERENT object param must not cross-contaminate —
    // `other.mode === 'z'` says nothing about `config.mode`, which stays unconstrained.
    it("VALID: {a requirement on another param's same-named property} => this property stays unconstrained", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev'] } })],
        requirements: [{ leaf: otherModeLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'dev' }] });
    });

    // A NESTED property path (`config.mode.sub`) constrains a sub-object, a later rung — the filter
    // only matches a single-level `config.<name>` read, so this property stays unconstrained even
    // though the requirement's path starts with its own name.
    it('VALID: {a nested property path (config.mode.sub)} => does not constrain the one-level mode property', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev'] } })],
        requirements: [{ leaf: nestedModeLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'dev' }] });
    });

    // The fill seam builds the property's own shape, so a nested object property is a real nested
    // object rather than a string standing in for one.
    it('VALID: {a nested object property nobody read} => the property is BUILT, not flattened', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndDb,
        demands: [
          PropertyDemandStub({ name: 'db', demand: { kind: 'unknown' } }),
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev'] } }),
        ],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: false,
        properties: [
          { name: 'db', value: { host: 'abc123' } },
          { name: 'mode', value: 'dev' },
        ],
      });
    });
  });

  // The OTHER reason a bucket is dropped, and never the same one: nothing is dead, there is simply no
  // value of the declared shape. Reporting it as `unreachable` would blame the reader's code.
  describe('a property the fill seam refuses', () => {
    it('INVALID: {a callable property nobody read} => unfillable, and the hole is not filled in', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndWrite,
        demands: [
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev'] } }),
          PropertyDemandStub({ name: 'write', demand: { kind: 'unknown' } }),
        ],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: true,
        properties: [{ name: 'mode', value: 'dev' }],
      });
    });

    // A guard CONSTRAINING an array property. The length axis realizes a four-character string, and no
    // string is a `string[]` — handing one over would let the guard measure it and PASS against an input
    // the code was never given. Refusing is the honest answer until an array of the right length can be
    // built; the unconstrained fill is not a fallback either, because `[]` violates the guard.
    it('INVALID: {a guard on an array property (tags.length > 3)} => unfillable, and no scalar stands in for the array', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndTags,
        demands: [],
        requirements: [{ leaf: tagsLengthLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: true,
        properties: [{ name: 'mode', value: 'abc123' }],
      });
    });

    it('INVALID: {the violating arm of the same array guard} => unfillable too, never an empty string for a string[]', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndTags,
        demands: [],
        requirements: [{ leaf: tagsLengthLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: true,
        properties: [{ name: 'mode', value: 'abc123' }],
      });
    });
  });

  // A truthiness read narrows neither arm, so the SATISFYING side is built out as usual — what is
  // refused is a demand the declared type has no value for, not the composite type itself.
  describe('the satisfying arm of a truthiness read', () => {
    it('VALID: {if (config.db)} => the real nested object, never a refusal', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndDb,
        demands: [],
        requirements: [{ leaf: dbTruthyLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: false,
        properties: [
          { name: 'db', value: { host: 'abc123' } },
          { name: 'mode', value: 'abc123' },
        ],
      });
    });

    it('VALID: {if (config.tags) on a string[]} => a real one-element array, never a refusal', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndTags,
        demands: [],
        requirements: [{ leaf: tagsTruthyLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: false,
        properties: [
          { name: 'mode', value: 'abc123' },
          { name: 'tags', value: ['abc123'] },
        ],
      });
    });
  });

  // The FALSY arm names no point, yet demands one the type has none of: `{}`, `[]` and
  // `{ host: 'abc123' }` are all truthy, so no arrangement reaches the else exit. Refusing drops the
  // bucket; calling it `unreachable` would brand correct code dead — and it is not dead, because the
  // walk drops `undefined`, so `db?: Db` and `db: Db` read alike here.
  describe('the falsy arm of a truthiness read on a property with no scalar point', () => {
    it('INVALID: {if (config.db), the violating arm} => unfillable, never a truthy object for a falsy arm', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndDb,
        demands: [],
        requirements: [{ leaf: dbTruthyLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: true,
        properties: [{ name: 'mode', value: 'abc123' }],
      });
    });

    it('INVALID: {if (config.tags) on a string[], the violating arm} => unfillable, since every array built is truthy', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndTags,
        demands: [],
        requirements: [{ leaf: tagsTruthyLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: true,
        properties: [{ name: 'mode', value: 'abc123' }],
      });
    });

    // A scalar property has both a truthy and a falsy point, so neither arm is refused — the domain
    // engine names '' and the case reaches the else exit for real.
    it('VALID: {if (config.mode) on a string, the violating arm} => the empty string, never a refusal', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [],
        requirements: [{ leaf: modeTruthyLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: false,
        properties: [{ name: 'mode', value: '' }],
      });
    });
  });

  // The violating arm of a `??` read realizes to EXACTLY `null` (`type-to-range`'s `non-nullish` case),
  // and `null` is a legitimate ArrangeValue — not an absence. A `??`/`||` chain preferring a fallback
  // over an explicit `undefined` check would treat that null as "nothing chosen" and silently replace it
  // with a fresh non-null fill, so the arranged case would never actually reach the `??` fall-through it
  // was built to drive.
  describe('the violating arm of a non-nullish (`??`) read', () => {
    it('VALID: {config.mode ?? fallback, the violating arm, no demand} => arranges the real null, never a non-null fill', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeOnly,
        demands: [],
        requirements: [{ leaf: modeNonNullishLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: null }] });
    });

    // The AUTHORITATIVE branch runs its own separate domain-vs-usable-values preference chain, so it
    // owes the same proof: a corrected `null` the domain admits must survive, never lose to a corrected
    // non-null sibling the guard does not actually satisfy.
    it("VALID: {mode: string | null, corrected ['x', null], the violating arm} => the corrected null, never the corrected 'x'", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeNullable,
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['x', null] } })],
        requirements: [{ leaf: modeNonNullishLeaf, want: false }],
        corrected: [symbolNameContract.parse('mode')],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: null }] });
    });
  });

  // Demands are UNIONED across every reader of the type, so a property one entry length-guards leaves
  // string demands on a `string[]` that another entry's arrangement must not place into it.
  describe('a demanded value that is not of the property s declared type', () => {
    it("INVALID: {tags: string[] unread here, demands ['', 'abc1'] from another entry's length guard} => the seam's array fill, never the string", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndTags,
        demands: [
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'dev'] } }),
          PropertyDemandStub({ name: 'tags', demand: { kind: 'demanded', values: ['', 'abc1'] } }),
        ],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: false,
        properties: [
          { name: 'mode', value: 'dev' },
          { name: 'tags', value: ['abc123'] },
        ],
      });
    });

    // The refusal still applies where the wrong-shaped demand cannot be replaced: a callable property
    // has no fill either, so the object keeps its hole.
    it('INVALID: {a string demand on a callable property} => unfillable, never the string', () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndWrite,
        demands: [
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['dev'] } }),
          PropertyDemandStub({ name: 'write', demand: { kind: 'demanded', values: ['abc123'] } }),
        ],
        requirements: [{ leaf: modeLeaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: true,
        properties: [{ name: 'mode', value: 'dev' }],
      });
    });
  });

  // The property-depth followup: `config.db.retry`, a path more than one segment deep. `object-arrange`
  // delegates the recursive build to `arrange-object-properties`; these two cases are the same
  // `checkDeep` shape the `property-depth` specimen exercises end to end, pinned here at the transformer
  // level with a before/after value pair for each arm.
  describe('a property path more than one segment deep (config.db.retry)', () => {
    const modeAndDeepDb = DeclaredTypeStub({
      name: 'Config',
      properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } }],
    });
    const dbRetryEq3Leaf = ConditionLeafStub({
      operandParamName: 'config',
      operandPropertyPath: ['db', 'retry'],
      operandTypeRef: 'Config',
      operandType: { kind: 'number' },
      predicate: { kind: 'eq', literal: 3 },
    });

    it("VALID: {config.db.retry === 3, the THEN arm} => db built as { retry: 3 }, never left unconstrained", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndDeepDb,
        demands: [
          PropertyDemandStub({
            name: 'db',
            demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } })] },
          }),
        ],
        requirements: [{ leaf: dbRetryEq3Leaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 3 } }] });
    });

    it("VALID: {config.db.retry === 3, the ELSE arm} => db built as { retry: 7 }, the demanded non-3 value", () => {
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndDeepDb,
        demands: [
          PropertyDemandStub({
            name: 'db',
            demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } })] },
          }),
        ],
        requirements: [{ leaf: dbRetryEq3Leaf, want: false }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 7 } }] });
    });

    // A depth-1 requirement on a DIFFERENT param's own `db.retry` must not leak in — the param filter
    // that used to check `operandPropertyPath.length === 1` at this level now only checks the param
    // name, so this proves the depth check moved without loosening the param check beside it.
    it("VALID: {a same-shaped requirement on a DIFFERENT param} => this param's db stays unconstrained", () => {
      const otherDbRetryLeaf = ConditionLeafStub({
        operandParamName: 'other',
        operandPropertyPath: ['db', 'retry'],
        operandTypeRef: 'Other',
        operandType: { kind: 'number' },
        predicate: { kind: 'eq', literal: 3 },
      });
      const result = objectArrangeTransformer({
        param: CONFIG,
        declaredType: modeAndDeepDb,
        demands: [],
        requirements: [{ leaf: otherDbRetryLeaf, want: true }],
        corrected: [],
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 7 } }] });
    });
  });
});

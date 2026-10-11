import { ArgvReadStub } from '@assayer/shared/contracts/argv-read/argv-read.stub';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { leafKnownValueTransformer } from './leaf-known-value-transformer';

// `process.argv[2]`, `Number(process.argv[2])` and `process.argv.slice(2)`, as the walk records them.
const ARGV_ENTRY = ArgvReadStub();
const ARGV_NUMBER = ArgvReadStub({ steps: [EnvStepStub({ kind: 'number' })] });
const ARGV_TAIL = ArgvReadStub({ shape: 'tail' });

describe('leafKnownValueTransformer', () => {
  describe('a leaf with no known value', () => {
    it('EMPTY: {an opaque call, truthy} => undefined, so the caller keeps else', () => {
      const leaf = ConditionLeafStub({ operandType: { kind: 'boolean' }, predicate: { kind: 'truthy' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });

    it('EMPTY: {an opaque boolean eq false} => undefined, since the type alone proves no value', () => {
      const leaf = ConditionLeafStub({ operandType: { kind: 'boolean' }, predicate: { kind: 'eq', literal: false } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });

    it('EMPTY: {process.argv[1] truthy} => undefined, since that entry is a path Assayer does not predict', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ArgvReadStub({ index: 1 }), predicate: { kind: 'truthy' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });

    it('EMPTY: {argv leaf, unrecognized} => undefined', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'unrecognized' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });
  });

  describe('a command-line leaf', () => {
    it("VALID: {process.argv[2] === 'yes'} => false", () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'eq', literal: 'yes' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it("VALID: {process.argv[2] !== 'yes'} => true", () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'neq', literal: 'yes' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it('VALID: {Number(process.argv[2]) truthy} => false, since NaN is falsy', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_NUMBER, predicate: { kind: 'truthy' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it('VALID: {Number(process.argv[2]) falsy} => true', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_NUMBER, predicate: { kind: 'falsy' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it.each(['gt', 'gte', 'lt', 'lte'] as const)('VALID: {Number(process.argv[2]) %s 5} => false, since NaN compares false', (kind) => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_NUMBER, predicate: { kind, literal: 5 } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it('VALID: {process.argv[2] === undefined} => true', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'undefined-eq' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it('VALID: {process.argv[2] !== undefined} => false', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'undefined-neq' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it('VALID: {process.argv[2] non-nullish} => false', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'non-nullish' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it("VALID: {typeof process.argv[2] === 'string'} => false, since the absent entry's tag is 'undefined'", () => {
      const leaf = ConditionLeafStub({
        operandArgvRead: ARGV_ENTRY,
        operandIsTypeof: true,
        predicate: { kind: 'typeof-eq', literal: 'string' },
      });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it("VALID: {typeof process.argv[2] !== 'string'} => true", () => {
      const leaf = ConditionLeafStub({
        operandArgvRead: ARGV_ENTRY,
        operandIsTypeof: true,
        predicate: { kind: 'typeof-neq', literal: 'string' },
      });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it('VALID: {process.argv.slice(2).length === 0} => true', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_TAIL, predicate: { kind: 'length-eq', literal: 0 } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it('VALID: {process.argv.slice(2).length} => false, since a bare length reads as length-neq 0', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_TAIL, predicate: { kind: 'length-neq', literal: 0 } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it.each([
      ['length-gt', 0, false],
      ['length-gte', 0, true],
      ['length-lt', 1, true],
      ['length-lte', 0, true],
    ] as const)('VALID: {process.argv.slice(2) %s %s} => %s', (kind, literal, expected) => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_TAIL, predicate: { kind, literal } });

      expect(leafKnownValueTransformer({ leaf })).toBe(expected);
    });

    it('EMPTY: {process.argv[2].length === 0} => undefined, since reading length off an absent entry throws', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'length-eq', literal: 0 } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });

    it('EMPTY: {argv leaf eq with no literal} => undefined', () => {
      const leaf = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'eq' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });
  });

  describe('a welded leaf', () => {
    it('VALID: {const value = 3, truthy} => true', () => {
      const leaf = ConditionLeafStub({ operandConstValue: 3, predicate: { kind: 'truthy' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it('VALID: {const xs = [a, b], length-eq 2} => true', () => {
      const leaf = ConditionLeafStub({ operandConstLength: 2, predicate: { kind: 'length-eq', literal: 2 } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it("VALID: {const value = 'Tonic', includes 'on'} => true", () => {
      const leaf = ConditionLeafStub({ operandConstValue: 'Tonic', predicate: { kind: 'includes', literal: 'on' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(true);
    });

    it("VALID: {const value = 'No', includes 'on'} => false", () => {
      const leaf = ConditionLeafStub({ operandConstValue: 'No', predicate: { kind: 'includes', literal: 'on' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(false);
    });

    it("EMPTY: {const value = 3, includes 'on'} => unknown, since a number has no text to search", () => {
      const leaf = ConditionLeafStub({ operandConstValue: 3, predicate: { kind: 'includes', literal: 'on' } });

      expect(leafKnownValueTransformer({ leaf })).toBe(undefined);
    });
  });
});

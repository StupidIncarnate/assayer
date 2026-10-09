import { evaluateConstPredicateLayerTransformer } from './evaluate-const-predicate-layer-transformer';

describe('evaluateConstPredicateLayerTransformer', () => {
  it('VALID: {truthy, "abc"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'truthy' })).toBe(true);
  });

  it('VALID: {truthy, ""} => returns false', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: '', predicateKind: 'truthy' })).toBe(false);
  });

  it('VALID: {falsy, ""} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: '', predicateKind: 'falsy' })).toBe(true);
  });

  it('VALID: {gt, "abc", "m"} => returns false', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'gt', literal: 'm' })).toBe(false);
  });

  it('VALID: {gt, "z", "m"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'z', predicateKind: 'gt', literal: 'm' })).toBe(true);
  });

  it('VALID: {gte, "m", "m"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'm', predicateKind: 'gte', literal: 'm' })).toBe(true);
  });

  it('VALID: {lt, "abc", "m"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'lt', literal: 'm' })).toBe(true);
  });

  it('VALID: {lte, "m", "m"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'm', predicateKind: 'lte', literal: 'm' })).toBe(true);
  });

  it('VALID: {eq, 3, 3} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 3, predicateKind: 'eq', literal: 3 })).toBe(true);
  });

  it('VALID: {neq, 3, 5} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 3, predicateKind: 'neq', literal: 5 })).toBe(true);
  });

  it('VALID: {non-nullish, "abc"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'non-nullish' })).toBe(true);
  });

  it('VALID: {undefined-eq, undefined} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: undefined, predicateKind: 'undefined-eq' })).toBe(true);
  });

  it('VALID: {undefined-neq, "abc"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'undefined-neq' })).toBe(true);
  });

  it('VALID: {typeof-eq, "abc", "string"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'typeof-eq', literal: 'string' })).toBe(true);
  });

  it('VALID: {typeof-neq, "abc", "number"} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'typeof-neq', literal: 'number' })).toBe(true);
  });

  it('VALID: {length-eq, "abc", 3} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'length-eq', literal: 3 })).toBe(true);
  });

  it('VALID: {length-neq, "abc", 2} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'length-neq', literal: 2 })).toBe(true);
  });

  it('VALID: {length-gt, "abc", 2} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'length-gt', literal: 2 })).toBe(true);
  });

  it('VALID: {length-gte, "abc", 3} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'length-gte', literal: 3 })).toBe(true);
  });

  it('VALID: {length-lt, "abc", 4} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'length-lt', literal: 4 })).toBe(true);
  });

  it('VALID: {length-lte, "abc", 3} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'length-lte', literal: 3 })).toBe(true);
  });

  it('EDGE: {unrecognized} => returns true', () => {
    expect(evaluateConstPredicateLayerTransformer({ value: 'abc', predicateKind: 'unrecognized' })).toBe(true);
  });
});

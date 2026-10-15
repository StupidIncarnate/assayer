import type { ValueMatcher } from './value-matcher';

describe('ValueMatcher', () => {
  it('VALID: {a literal string} => is usable as a ValueMatcher exact-match value', () => {
    const matcher = 'pokayoke:quest:1' satisfies ValueMatcher;

    expect(matcher).toBe('pokayoke:quest:1');
  });

  it('VALID: {a predicate function} => is usable as a ValueMatcher tolerant-match value, evaluated against the real value', () => {
    const matcher = ((value: unknown): boolean =>
      String(value).startsWith('pokayoke:quest:')) satisfies ValueMatcher;

    expect(matcher('pokayoke:quest:1')).toBe(true);
    expect(matcher('other:key')).toBe(false);
  });
});

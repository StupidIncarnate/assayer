import { analysisHashTransformer } from './analysis-hash-transformer';

describe('analysisHashTransformer', () => {
  it('EMPTY: {a file no tsconfig owns} => hashes the forced options key and the bytes', () => {
    expect(analysisHashTransformer({ content: 'export const a = 1;\n', options: {} })).toBe(
      '278cd2eb8a5ff504fe51a1eb6395e1924a27562a34e02778fda65c0645eea29e',
    );
  });

  it('VALID: {an owner with an ES2022 target} => a different key for the same bytes', () => {
    expect(analysisHashTransformer({ content: 'export const a = 1;\n', options: { target: 9 } })).toBe(
      'b15da0a5c86af3b64830dd0d403bba2e171576f2107d71889e22b864a96cd271',
    );
  });

  it('VALID: {owners that differ only in an option the walk ignores} => one key', () => {
    expect(
      analysisHashTransformer({ content: 'export const a = 1;\n', options: { target: 9, outDir: '/a/dist' } }),
    ).toBe('b15da0a5c86af3b64830dd0d403bba2e171576f2107d71889e22b864a96cd271');
  });
});

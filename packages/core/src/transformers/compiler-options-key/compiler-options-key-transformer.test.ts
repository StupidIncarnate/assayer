import { compilerOptionsKeyTransformer } from './compiler-options-key-transformer';

describe('compilerOptionsKeyTransformer', () => {
  it('EMPTY: {no options} => returns an empty JSON list', () => {
    expect(compilerOptionsKeyTransformer({ options: {} })).toBe('[]');
  });

  it('VALID: {options in any order} => returns the entries sorted by name', () => {
    expect(compilerOptionsKeyTransformer({ options: { target: 9, lib: ['lib.es2022.d.ts'], strictNullChecks: true } })).toBe(
      '[["lib",["lib.es2022.d.ts"]],["strictNullChecks",true],["target",9]]',
    );
  });

  it('VALID: {one set spelled in two orders} => both give one key', () => {
    expect(compilerOptionsKeyTransformer({ options: { strict: true, target: 9 } })).toBe(
      compilerOptionsKeyTransformer({ options: { target: 9, strict: true } }),
    );
  });
});

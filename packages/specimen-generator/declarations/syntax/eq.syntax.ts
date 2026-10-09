import { syntax } from '../kit';

export const eqSyntax = syntax({
  description: 'a value compared with an expected value using ===',
  // Unconstrained, because === compares any two values of one type. A combination TypeScript rejects, such
  // as `const flag: boolean = true` compared with `false`, is refused when the generator typechecks it.
  code: <T>(value: T, expected: T): boolean => value === expected,
  anchors: { expected: { number: 7, string: 'xyz', boolean: false } },
});

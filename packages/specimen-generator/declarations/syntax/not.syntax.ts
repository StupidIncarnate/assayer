import { syntax } from '../kit';

export const notSyntax = syntax({
  description: 'a value negated with !',
  // Generic because `!` tests truthiness, which every type has.
  code: <T>(value: T): boolean => !value,
});

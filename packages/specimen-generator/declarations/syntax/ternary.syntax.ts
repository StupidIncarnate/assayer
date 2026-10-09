import { $arm, syntax } from '../kit';

export const ternarySyntax = syntax({
  description: 'a conditional expression',
  // Generic over the condition, which is a truthiness test like `if`'s. The result is `string`, because
  // each arm is an `$arm` marker the generator writes as its name.
  code: <T>(cond: T): string => (cond ? $arm('then') : $arm('else')),
});

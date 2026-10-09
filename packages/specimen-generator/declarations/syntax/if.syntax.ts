import { $arm, syntax } from '../kit';

export const ifSyntax = syntax({
  description: 'an if statement whose else falls through to the code after it',
  // Generic because `if` tests truthiness: `if (count)` and `if (name)` are as ordinary as `if (flag)`.
  code: <T>(cond: T): void => {
    if (cond) {
      $arm('then');
    }
    $arm('else');
  },
});

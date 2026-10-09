import { $R, $stmts, container } from '../kit';

export const functionExpressionContainer = container({
  description: 'a function expression assigned to an exported const',
  slots: {
    body: { reach: 'call', arm: 'return' },
  },
  code: () => {
    const $Entry = function ($params: never): $R {
      $stmts('body');
    };
  },
});

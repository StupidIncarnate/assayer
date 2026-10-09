import { $expr, $R, $stmts, container } from '../kit';

export const arrowFunctionContainer = container({
  description: 'an arrow function assigned to an exported const',
  slots: {
    'block-body': { reach: 'call', arm: 'return' },
    'expression-body': { reach: 'call' },
  },
  // Each block is one shape of the entry. The generator keeps the block that holds the slot in focus.
  code: () => {
    {
      const $Entry = ($params: never): $R => {
        $stmts('block-body');
      };
    }
    {
      const $Entry = ($params: never): $R => $expr('expression-body');
    }
  },
});

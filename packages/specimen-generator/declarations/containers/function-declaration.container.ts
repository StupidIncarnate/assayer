import { $expr, $R, $stmts, container } from '../kit';

export const functionDeclarationContainer = container({
  description: 'an exported function declaration',
  slots: {
    body: { reach: 'call', arm: 'return' },
    'default-param': { reach: 'call' },
  },
  // Each block is one shape of the entry. The generator keeps the block that holds the slot in focus.
  code: () => {
    {
      function $Entry($params: never): $R {
        $stmts('body');
      }
    }
    {
      function $Entry($params: never, label: $R = $expr('default-param')): $R {
        return label;
      }
    }
  },
});

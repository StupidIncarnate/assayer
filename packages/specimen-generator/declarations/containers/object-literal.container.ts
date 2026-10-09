import { $expr, $R, $stmts, container } from '../kit';

export const objectLiteralContainer = container({
  description: 'an exported object literal',
  slots: {
    method: { reach: 'call-member', arm: 'return' },
    'arrow-property': { reach: 'call-member', arm: 'return' },
    property: { reach: 'module-load' },
  },
  code: () => {
    const $Entry = {
      run($params: never): $R {
        $stmts('method');
      },
      runArrow: ($params: never): $R => {
        $stmts('arrow-property');
      },
      label: $expr('property'),
    };
  },
});

import { $expr, $stmts, container } from '../kit';

export const moduleContainer = container({
  description: 'the top level of a module',
  slots: {
    statement: { reach: 'module-load', arm: 'log' },
    'exported-const': { reach: 'module-load' },
  },
  code: () => {
    $stmts('statement');
    const $Entry = $expr('exported-const');
  },
});

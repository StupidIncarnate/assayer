import { $exportDefault, $R, $stmts, container } from '../kit';

export const defaultExportContainer = container({
  description: 'an arrow function that is the default export',
  slots: {
    body: { reach: 'call', arm: 'return' },
  },
  code: () => {
    const $Entry = ($params: never): $R => {
      $stmts('body');
    };
    $exportDefault($Entry);
  },
});

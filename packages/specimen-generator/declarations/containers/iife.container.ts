import { $R, $stmts, container } from '../kit';

export const iifeContainer = container({
  description: 'an immediately invoked arrow function whose result is exported',
  slots: {
    body: { reach: 'module-load', arm: 'return' },
  },
  code: () => {
    const $Entry = ((): $R => {
      $stmts('body');
    })();
  },
});

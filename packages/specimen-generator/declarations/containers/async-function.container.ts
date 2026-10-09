import { $R, $stmts, container } from '../kit';

export const asyncFunctionContainer = container({
  description: 'an async function, with the slot after an await',
  slots: {
    body: { reach: 'call-and-await', arm: 'return' },
  },
  code: () => {
    async function $Entry($params: never): Promise<$R> {
      await Promise.resolve();
      $stmts('body');
    }
  },
});

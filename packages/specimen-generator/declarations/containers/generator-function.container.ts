import { $R, $stmts, container } from '../kit';

export const generatorFunctionContainer = container({
  description: 'a generator function',
  slots: {
    body: { reach: 'call-and-iterate', arm: 'yield' },
  },
  code: () => {
    function* $Entry($params: never): Generator<$R> {
      $stmts('body');
    }
  },
});

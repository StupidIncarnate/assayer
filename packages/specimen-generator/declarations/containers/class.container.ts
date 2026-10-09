import { $expr, $R, $stmts, container } from '../kit';

export const classContainer = container({
  description: 'an exported class',
  slots: {
    method: { reach: 'construct-then-call', arm: 'return' },
    'static-method': { reach: 'call-static', arm: 'return' },
    getter: { reach: 'construct-then-read', arm: 'return' },
    'constructor-body': { reach: 'construct', arm: 'log' },
    field: { reach: 'construct' },
    'static-field': { reach: 'module-load' },
  },
  code: () => {
    class $Entry {
      public label = $expr('field');
      public static label = $expr('static-field');
      public constructor($params: never) {
        $stmts('constructor-body');
      }
      public run($params: never): $R {
        $stmts('method');
      }
      public static run($params: never): $R {
        $stmts('static-method');
      }
      public get result(): $R {
        // TypeScript requires a getter to contain a return, so this slot is written as one.
        return $stmts('getter');
      }
    }
  },
});

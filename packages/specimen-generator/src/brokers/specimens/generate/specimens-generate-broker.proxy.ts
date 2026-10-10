import { declarationsLoadBrokerProxy } from '../../declarations/load/declarations-load-broker.proxy';
import { specimensTypecheckBrokerProxy } from '../typecheck/specimens-typecheck-broker.proxy';

const KIT = [
  'export declare const $arm: (name: string) => never;',
  'export declare const $stmts: (slot: string) => never;',
  'export declare const $expr: <T = any>(slot: string) => T;',
  'export type $R = any;',
  'export declare const container: (c: { description: string; slots: Record<string, { reach: string; arm?: string }>; code: () => void }) => typeof c;',
  'export declare const syntax: (p: { description: string; code: (...holes: any[]) => unknown; anchors?: Record<string, unknown> }) => typeof p;',
  '',
].join('\n');

const FUNCTION_DECLARATION_CONTAINER = [
  "import { $expr, $R, $stmts, container } from '../kit';",
  '',
  'export const functionDeclarationContainer = container({',
  "  description: 'an exported function declaration',",
  '  slots: {',
  "    body: { reach: 'call', arm: 'return' },",
  "    'default-param': { reach: 'call' },",
  '  },',
  '  code: () => {',
  '    {',
  '      function $Entry($params: never): $R {',
  "        $stmts('body');",
  '      }',
  '    }',
  '    {',
  "      function $Entry($params: never, label: $R = $expr('default-param')): $R {",
  '        return label;',
  '      }',
  '    }',
  '  },',
  '});',
  '',
].join('\n');

// TypeScript rejects every specimen from this container, because its unused local fails the strict
// compiler options the specimens are checked under.
const UNUSED_LOCAL_CONTAINER = [
  "import { $R, $stmts, container } from '../kit';",
  '',
  'export const unusedLocalContainer = container({',
  "  description: 'a function with a local it never reads',",
  "  slots: { body: { reach: 'call', arm: 'return' } },",
  '  code: () => {',
  '    function $Entry($params: never): $R {',
  '      const unused = 1;',
  "      $stmts('body');",
  '    }',
  '  },',
  '});',
  '',
].join('\n');

// With the container below, `x` has two slots whose names normalize to the same slug, giving two
// specimens the same path.
const X_CONTAINER = [
  "import { $R, $stmts, container } from '../kit';",
  '',
  'export const xContainer = container({',
  "  description: 'a function with two bodies',",
  '  slots: {',
  "    'y-z': { reach: 'call', arm: 'return' },",
  "    yZ: { reach: 'call', arm: 'return' },",
  '  },',
  '  code: () => {',
  '    {',
  '      function $Entry($params: never): $R {',
  "        $stmts('y-z');",
  '      }',
  '    }',
  '    {',
  '      function $Entry($params: never): $R {',
  "        $stmts('yZ');",
  '      }',
  '    }',
  '  },',
  '});',
  '',
].join('\n');

const IF_SYNTAX = [
  "import { $arm, syntax } from '../kit';",
  '',
  'export const ifSyntax = syntax({',
  "  description: 'an if statement whose else falls through to the code after it',",
  '  code: <T>(cond: T): void => {',
  '    if (cond) {',
  "      $arm('then');",
  '    }',
  "    $arm('else');",
  '  },',
  '});',
  '',
].join('\n');

const GT_SYNTAX = [
  "import { syntax } from '../kit';",
  '',
  'export const gtSyntax = syntax({',
  "  description: 'a value compared with a limit using >',",
  '  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,',
  "  anchors: { limit: { number: 5, string: 'm' } },",
  '});',
  '',
].join('\n');

const NULLISH_SYNTAX = [
  "import { syntax } from '../kit';",
  '',
  'export const nullishSyntax = syntax({',
  "  description: 'a value that may be undefined, defaulted with ??',",
  '  code: <T>(value: T | undefined, fallback: T): T => value ?? fallback,',
  "  anchors: { fallback: { number: 0, string: '', boolean: false } },",
  '});',
  '',
].join('\n');

const TERNARY_SYNTAX = [
  "import { $arm, syntax } from '../kit';",
  '',
  'export const ternarySyntax = syntax({',
  "  description: 'a conditional expression',",
  "  code: <T>(cond: T): string => (cond ? $arm('then') : $arm('else')),",
  '});',
  '',
].join('\n');

const SYNTAX_FILES = [
  { relPath: 'kit.ts', content: KIT },
  { relPath: 'syntax/if.syntax.ts', content: IF_SYNTAX },
  { relPath: 'syntax/gt.syntax.ts', content: GT_SYNTAX },
  { relPath: 'syntax/nullish.syntax.ts', content: NULLISH_SYNTAX },
  { relPath: 'syntax/ternary.syntax.ts', content: TERNARY_SYNTAX },
];

const CONTAINER_FILES = {
  clean: [{ relPath: 'containers/function-declaration.container.ts', content: FUNCTION_DECLARATION_CONTAINER }],
  refusing: [
    { relPath: 'containers/function-declaration.container.ts', content: FUNCTION_DECLARATION_CONTAINER },
    { relPath: 'containers/unused-local.container.ts', content: UNUSED_LOCAL_CONTAINER },
  ],
  colliding: [
    { relPath: 'containers/x.container.ts', content: X_CONTAINER },
  ],
} as const;

export const specimensGenerateBrokerProxy = (): {
  // A declarations folder with the `if`, `gt`, `nullish` and `ternary` syntaxes and these containers:
  //   clean      (the default) `function-declaration`, with a statement slot `body` and an expression slot `default-param`
  //   refusing   `clean` plus `unused-local`, whose every specimen TypeScript rejects
  //   colliding  `x` (slots `y-z` and `yZ`), which give two specimens one path
  setupTree: ({
    declarationsRoot,
    scenario,
    syntaxes,
  }: {
    declarationsRoot: string;
    scenario?: keyof typeof CONTAINER_FILES;
    syntaxes?: readonly ('if' | 'gt' | 'nullish' | 'ternary')[];
  }) => void;
} => {
  const declarations = declarationsLoadBrokerProxy();
  specimensTypecheckBrokerProxy();

  return {
    setupTree: ({ declarationsRoot, scenario = 'clean', syntaxes }): void => {
      const syntaxFiles =
        syntaxes === undefined
          ? SYNTAX_FILES
          : [
              { relPath: 'kit.ts', content: KIT },
              ...SYNTAX_FILES.filter(({ relPath }) =>
                syntaxes.some((syntax) => relPath === `syntax/${syntax}.syntax.ts`),
              ),
            ];
      declarations.setupTree({ declarationsRoot, files: [...syntaxFiles, ...CONTAINER_FILES[scenario]] });
    },
  };
};

import { DeclarationError } from '../../../errors/declaration/declaration-error';
import { declarationsLoadBroker } from './declarations-load-broker';
import { declarationsLoadBrokerProxy } from './declarations-load-broker.proxy';

const ROOT = '/virtual/declarations';

const KIT = [
  'export declare const $arm: (name: string) => never;',
  'export declare const $stmts: (slot: string) => never;',
  'export declare const $expr: <T = any>(slot: string) => T;',
  'export declare const container: (c: { description: string; slots: Record<string, { reach: string; arm?: string }>; code: () => void }) => typeof c;',
  'export declare const syntax: (p: { description: string; code: (...holes: any[]) => unknown; anchors?: Record<string, unknown> }) => typeof p;',
  'export declare const shim: (s: { description: string; builtin: string; form: { kind: string; name: string }; code: (...args: any[]) => unknown }) => typeof s;',
  '',
].join('\n');

const BODY_CONTAINER = [
  "import { $stmts, container } from '../kit';",
  '',
  'export const bodyContainer = container({',
  "  description: 'a function body',",
  "  slots: { statement: { reach: 'call', arm: 'log' } },",
  '  code: () => {',
  '    const $Entry = () => {',
  "      $stmts('statement');",
  '    };',
  '  },',
  '});',
  '',
].join('\n');

const IF_SYNTAX = [
  "import { $arm, syntax } from '../kit';",
  '',
  'export const ifSyntax = syntax({',
  "  description: 'a branch',",
  '  code: (condition: boolean): void => {',
  '    if (condition) {',
  "      $arm('then');",
  '    } else {',
  "      $arm('else');",
  '    }',
  '  },',
  '});',
  '',
].join('\n');

const EQ_SYNTAX = [
  "import { syntax } from '../kit';",
  '',
  'export const eqSyntax = syntax({',
  "  description: 'two values compared with ===',",
  '  code: <T extends number>(left: T, right: T): boolean => left === right,',
  '  anchors: { right: { number: 5 } },',
  '});',
  '',
].join('\n');

const ARRAY_LENGTH_SHIM = [
  "import { shim } from '../kit';",
  '',
  'export const arrayLengthShim = shim({',
  "  description: 'the number of elements in an array',",
  "  builtin: 'Array.prototype.length',",
  "  form: { kind: 'getter', name: 'length' },",
  '  code: <T>(receiver: readonly T[]): number => receiver.length,',
  '});',
  '',
].join('\n');

const SIBLING_IMPORTING_SYNTAX = [
  "import { $arm, syntax } from '../kit';",
  "import { helper } from '../helper';",
  '',
  'export const ifSyntax = syntax({',
  '  description: helper,',
  '  code: (condition: boolean): void => {',
  '    if (condition) {',
  "      $arm('then');",
  '    }',
  '  },',
  '});',
  '',
].join('\n');

describe('declarationsLoadBroker', () => {
  it('VALID: {one container, two syntaxes, one shim} => returns each loaded shape, sorted by name', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'syntax/if.syntax.ts', content: IF_SYNTAX },
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'shims/array-length.shim.ts', content: ARRAY_LENGTH_SHIM },
        { relPath: 'containers/body.container.ts', content: BODY_CONTAINER },
        { relPath: 'syntax/eq.syntax.ts', content: EQ_SYNTAX },
      ],
    });

    const result = declarationsLoadBroker({ declarationsRoot: ROOT });

    expect({
      syntaxes: result.syntaxes.map(
        ({ name, origin, kind, holes, returnType, arms, allowedTypeArguments, anchors }) => ({
          name,
          origin,
          kind,
          holes: holes.map((hole) => hole.name),
          returnType,
          arms,
          allowedTypeArguments,
          anchors: JSON.stringify(anchors),
        }),
      ),
      containers: result.containers.map(({ name, description, slots, isClass, exportsDefault }) => ({
        name,
        description,
        slots: slots.map((slot) => slot.name),
        isClass,
        exportsDefault,
      })),
    }).toStrictEqual({
      syntaxes: [
        {
          name: 'array-length',
          origin: 'shim',
          kind: 'expression',
          holes: ['receiver'],
          returnType: 'number',
          arms: [],
          allowedTypeArguments: ['number', 'boolean', 'string'],
          anchors: '{}',
        },
        {
          name: 'eq',
          origin: 'syntax',
          kind: 'expression',
          holes: ['left', 'right'],
          returnType: 'boolean',
          arms: [],
          allowedTypeArguments: ['number'],
          anchors: '{"right":{"number":5}}',
        },
        {
          name: 'if',
          origin: 'syntax',
          kind: 'statement',
          holes: ['condition'],
          returnType: 'void',
          arms: ['then', 'else'],
          allowedTypeArguments: [],
          anchors: '{}',
        },
      ],
      containers: [
        {
          name: 'body',
          description: 'a function body',
          slots: ['statement'],
          isClass: false,
          exportsDefault: false,
        },
      ],
    });
  });

  it('VALID: {a syntax whose code calls $arm} => the loaded code throws the arm it reached', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'syntax/if.syntax.ts', content: IF_SYNTAX },
      ],
    });

    const [ifSyntax] = declarationsLoadBroker({ declarationsRoot: ROOT }).syntaxes;

    expect(() => ifSyntax?.code(true)).toThrow(/^the syntax reached its 'then' arm$/u);
  });

  it('EMPTY: {no declaration files} => returns no syntaxes and no containers', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({ declarationsRoot: ROOT, files: [] });

    const result = declarationsLoadBroker({ declarationsRoot: ROOT });

    expect(result).toStrictEqual({ syntaxes: [], containers: [] });
  });

  it('INVALID: {a property of the wrong type} => throws quoting the diagnostic with its file and line', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        {
          relPath: 'syntax/if.syntax.ts',
          content: [
            "import { syntax } from '../kit';",
            'export const ifSyntax = syntax({',
            '  description: 5,',
            '  code: (): void => {},',
            '});',
            '',
          ].join('\n'),
        },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/tsconfig.json',
        message:
          "the declarations have TypeScript errors. Fix each one:\n/virtual/declarations/syntax/if.syntax.ts:3: Type 'number' is not assignable to type 'string'.",
      }),
    );
  });

  it('INVALID: {tsconfig TypeScript cannot read} => throws naming the config', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupUnreadableConfig({ declarationsRoot: ROOT });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/tsconfig.json',
        message: 'TypeScript cannot read this config. Add a tsconfig.json to the declarations folder.',
      }),
    );
  });

  it('INVALID: {export named thenSyntax in if.syntax.ts} => throws naming the file, the expected name and the export', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'syntax/if.syntax.ts', content: IF_SYNTAX.replace('ifSyntax', 'thenSyntax') },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/syntax/if.syntax.ts',
        message:
          'must export exactly one const named ifSyntax. It exports: thenSyntax. Rename or remove the exports.',
      }),
    );
  });

  it('INVALID: {two exports} => throws listing both', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'syntax/if.syntax.ts', content: `${IF_SYNTAX}export const extra = 1;\n` },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/syntax/if.syntax.ts',
        message:
          'must export exactly one const named ifSyntax. It exports: ifSyntax, extra. Rename or remove the exports.',
      }),
    );
  });

  it('EMPTY: {no exports} => throws saying it exports nothing', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'syntax/if.syntax.ts', content: 'export {};\n' },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/syntax/if.syntax.ts',
        message: 'must export exactly one const named ifSyntax. It exports: nothing. Rename or remove the exports.',
      }),
    );
  });

  it('INVALID: {imports a sibling file} => throws naming the specifier and the only allowed import', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'helper.ts', content: "export const helper = 'text';\n" },
        { relPath: 'syntax/if.syntax.ts', content: SIBLING_IMPORTING_SYNTAX },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/syntax/if.syntax.ts',
        message:
          "imports '../helper', and a declaration may import only '../kit'. Remove the import. A declaration is read by being run, so anything it imports would run during a load.",
      }),
    );
  });

  it('ERROR: {throws an Error while it loads} => throws naming the file and the message', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'syntax/if.syntax.ts', content: `${IF_SYNTAX}throw new Error('boom');\n` },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/syntax/if.syntax.ts',
        message: 'throws while it loads: Error: boom. Fix the declaration so that evaluating it throws nothing.',
      }),
    );
  });

  it('ERROR: {throws a plain string while it loads} => throws naming the file and the text', () => {
    const proxy = declarationsLoadBrokerProxy();
    proxy.setupTree({
      declarationsRoot: ROOT,
      files: [
        { relPath: 'kit.ts', content: KIT },
        { relPath: 'syntax/if.syntax.ts', content: `${IF_SYNTAX}throw 'plain text';\n` },
      ],
    });

    expect(() => declarationsLoadBroker({ declarationsRoot: ROOT })).toThrow(
      new DeclarationError({
        file: '/virtual/declarations/syntax/if.syntax.ts',
        message: 'throws while it loads: plain text. Fix the declaration so that evaluating it throws nothing.',
      }),
    );
  });
});

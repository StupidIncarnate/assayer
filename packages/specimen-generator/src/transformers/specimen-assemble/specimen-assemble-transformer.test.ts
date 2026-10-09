import ts from '#gateway/npm/typescript';

import { containerShapeTransformer } from '../container-shape/container-shape-transformer';
import { specimenAssembleTransformer } from './specimen-assemble-transformer';

const FUNCTION_CONTAINERS = [
  ts.createSourceFile(
    'function-declaration.container.ts',
    `export const functionDeclarationContainer = container({
  code: () => {
    // Each block is one shape of the entry.
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
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: {
      description: 'an exported function declaration',
      slots: { body: { reach: 'call', arm: 'return' }, 'default-param': { reach: 'call' } },
    },
    name: 'function-declaration',
  }),
);

const CLASS_CONTAINERS = [
  ts.createSourceFile(
    'class.container.ts',
    `export const classContainer = container({
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
        return $stmts('getter');
      }
    }
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: {
      description: 'an exported class',
      slots: {
        method: { reach: 'construct-then-call', arm: 'return' },
        'static-method': { reach: 'call-static', arm: 'return' },
        getter: { reach: 'construct-then-read', arm: 'return' },
        'constructor-body': { reach: 'construct', arm: 'log' },
        field: { reach: 'construct' },
        'static-field': { reach: 'module-load' },
      },
    },
    name: 'class',
  }),
);

const MODULE_CONTAINERS = [
  ts.createSourceFile(
    'module.container.ts',
    `export const moduleContainer = container({
  code: () => {
    $stmts('statement');
    const $Entry = $expr('exported-const');
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: {
      description: 'the top level of a module',
      slots: { statement: { reach: 'module-load', arm: 'log' }, 'exported-const': { reach: 'module-load' } },
    },
    name: 'module',
  }),
);

const GENERATOR_CONTAINERS = [
  ts.createSourceFile(
    'generator-function.container.ts',
    `export const generatorFunctionContainer = container({
  code: () => {
    function* $Entry($params: never): Generator<$R> {
      $stmts('body');
    }
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: {
      description: 'a generator function',
      slots: { body: { reach: 'call-and-iterate', arm: 'yield' } },
    },
    name: 'generator-function',
  }),
);

const DEFAULT_EXPORT_CONTAINERS = [
  ts.createSourceFile(
    'default-export.container.ts',
    `export const defaultExportContainer = container({
  code: () => {
    const $Entry = ($params: never): $R => {
      $stmts('body');
    };
    $exportDefault($Entry);
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: {
      description: 'an arrow function that is the default export',
      slots: { body: { reach: 'call', arm: 'return' } },
    },
    name: 'default-export',
  }),
);

const OBJECT_CONTAINERS = [
  ts.createSourceFile(
    'object-literal.container.ts',
    `export const objectLiteralContainer = container({
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
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: {
      description: 'an exported object literal',
      slots: {
        method: { reach: 'call-member', arm: 'return' },
        'arrow-property': { reach: 'call-member', arm: 'return' },
        property: { reach: 'module-load' },
      },
    },
    name: 'object-literal',
  }),
);

const MISUSED_MARKER_CONTAINERS = [
  ts.createSourceFile(
    'misused.container.ts',
    `export const misusedContainer = container({
  code: () => {
    function $Entry($params: never): $R {
      const inner = $stmts('body');
    }
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: { description: 'a marker used as a value', slots: { body: { reach: 'call', arm: 'return' } } },
    name: 'misused',
  }),
);

const EXPRESSION_BODY_CONTAINERS = [
  ts.createSourceFile(
    'expression-body.container.ts',
    `export const expressionBodyContainer = container({
  code: () => $expr('whole'),
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
].map((sourceFile) =>
  containerShapeTransformer({
    sourceFile,
    declared: { description: 'a container that is one expression', slots: { whole: { reach: 'module-load' } } },
    name: 'expression-body',
  }),
);

const MODULE_EXPRESSION_PAIRS = MODULE_CONTAINERS.flatMap((container) =>
  container.slots.filter((slot) => slot.name === 'exported-const').map((slot) => ({ container, slot })),
);
const MISUSED_PAIRS = MISUSED_MARKER_CONTAINERS.flatMap((container) =>
  container.slots.map((slot) => ({ container, slot })),
);
const EXPRESSION_BODY_PAIRS = EXPRESSION_BODY_CONTAINERS.flatMap((container) =>
  container.slots.map((slot) => ({ container, slot })),
);

describe('specimenAssembleTransformer', () => {
  it('VALID: {function-declaration, slot body, if over gt with a param} => keeps the first block, exports the function and writes the parameter', () => {
    const results = FUNCTION_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'body')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
              params: [{ name: 'value', type: 'number' }],
              declarations: [],
            },
            focusKind: 'statement',
            resultType: 'string',
            entryName: 'ifFunction',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'export function ifFunction(value: number): string {',
        '    if (value > 5) {',
        "        return 'then';",
        '    }',
        "    return 'else';",
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {function-declaration, slot default-param, ternary over gt with a param} => keeps the second block and puts the conditional in the default value', () => {
    const results = FUNCTION_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'default-param')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "value > 5 ? 'then' : 'else'",
              params: [{ name: 'value', type: 'number' }],
              declarations: [],
            },
            focusKind: 'expression',
            resultType: 'string',
            entryName: 'ternaryFunction',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        "export function ternaryFunction(value: number, label: string = value > 5 ? 'then' : 'else'): string {",
        '    return label;',
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {function-declaration, slot body, an expression focus} => wraps the expression in the slot arm as a return', () => {
    const results = FUNCTION_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'body')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: 'receiver.at(arrayLengthReceiver.length)',
              params: [
                { name: 'receiver', type: 'readonly number[]' },
                { name: 'arrayLengthReceiver', type: 'readonly number[]' },
              ],
              declarations: [],
            },
            focusKind: 'expression',
            resultType: 'number | undefined',
            entryName: 'atFunction',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'export function atFunction(receiver: readonly number[], arrayLengthReceiver: readonly number[]): number | undefined {',
        '    return receiver.at(arrayLengthReceiver.length);',
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {class, slot method, a const declaration} => keeps only the method, puts the const first and exports the class', () => {
    const results = CLASS_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'method')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
              params: [],
              declarations: [{ name: 'value', text: 'const value: number = 3;' }],
            },
            focusKind: 'statement',
            resultType: 'string',
            entryName: 'IfClass',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'const value: number = 3;',
        '',
        'export class IfClass {',
        '    public run(): string {',
        '        if (value > 5) {',
        "            return 'then';",
        '        }',
        "        return 'else';",
        '    }',
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {class, slot getter, a statement focus} => replaces the return around the marker with the statements', () => {
    const results = CLASS_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'getter')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
              params: [],
              declarations: [{ name: 'value', text: 'const value: number = 3;' }],
            },
            focusKind: 'statement',
            resultType: 'string',
            entryName: 'IfClass',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'const value: number = 3;',
        '',
        'export class IfClass {',
        '    public get result(): string {',
        '        if (value > 5) {',
        "            return 'then';",
        '        }',
        "        return 'else';",
        '    }',
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {class, slot static-field, a ternary over an env const} => puts the conditional in the field and keeps only that field', () => {
    const results = CLASS_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'static-field')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "cond ? 'then' : 'else'",
              params: [],
              declarations: [{ name: 'cond', text: 'const cond = Number(process.env.COND);' }],
            },
            focusKind: 'expression',
            resultType: 'string',
            entryName: 'TernaryClass',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'const cond = Number(process.env.COND);',
        '',
        'export class TernaryClass {',
        "    public static label = cond ? 'then' : 'else';",
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {module, slot statement, if with log arms over an env const} => writes the statements at the top level and adds export {}', () => {
    const results = MODULE_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'statement')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "if (value > 5) {\n    console.log('then');\n}\nconsole.log('else');",
              params: [],
              declarations: [{ name: 'value', text: 'const value = Number(process.env.VALUE);' }],
            },
            focusKind: 'statement',
            resultType: 'string',
            entryName: 'moduleEntry',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'const value = Number(process.env.VALUE);',
        '',
        'if (value > 5) {',
        "    console.log('then');",
        '}',
        '',
        "console.log('else');",
        '',
        'export {};',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {module, slot statement, an expression focus} => wraps the expression in console.log', () => {
    const results = MODULE_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'statement')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: 'value > 5',
              params: [],
              declarations: [{ name: 'value', text: 'const value = Number(process.env.VALUE);' }],
            },
            focusKind: 'expression',
            resultType: 'boolean',
            entryName: 'moduleEntry',
          }),
        ),
    );

    expect(results).toStrictEqual([
      ['const value = Number(process.env.VALUE);', '', 'console.log(value > 5);', '', 'export {};', ''].join('\n'),
    ]);
  });

  it('VALID: {module, slot exported-const, an external read} => exports the const and drops the statement slot', () => {
    const results = MODULE_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'exported-const')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: { text: 'Number(process.argv[2])', params: [], declarations: [] },
            focusKind: 'expression',
            resultType: 'number',
            entryName: 'moduleValue',
          }),
        ),
    );

    expect(results).toStrictEqual(['export const moduleValue = Number(process.argv[2]);\n']);
  });

  it('VALID: {generator-function, slot body, if with yield arms} => writes the result type inside Generator', () => {
    const results = GENERATOR_CONTAINERS.flatMap((container) =>
      container.slots.map((slot) =>
        specimenAssembleTransformer({
          container,
          slot,
          rendered: {
            text: "if (value > 5) {\n    yield 'then';\n}\nyield 'else';",
            params: [{ name: 'value', type: 'number' }],
            declarations: [],
          },
          focusKind: 'statement',
          resultType: 'string',
          entryName: 'ifGenerator',
        }),
      ),
    );

    expect(results).toStrictEqual([
      [
        'export function* ifGenerator(value: number): Generator<string> {',
        '    if (value > 5) {',
        "        yield 'then';",
        '    }',
        "    yield 'else';",
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {generator-function, an expression focus} => wraps the expression in yield', () => {
    const results = GENERATOR_CONTAINERS.flatMap((container) =>
      container.slots.map((slot) =>
        specimenAssembleTransformer({
          container,
          slot,
          rendered: { text: 'value > 5', params: [{ name: 'value', type: 'number' }], declarations: [] },
          focusKind: 'expression',
          resultType: 'boolean',
          entryName: 'valueGenerator',
        }),
      ),
    );

    expect(results).toStrictEqual([
      [
        'export function* valueGenerator(value: number): Generator<boolean> {',
        '    yield value > 5;',
        '}',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {default-export container} => exports the entry by default and does not add an export keyword or export {}', () => {
    const results = DEFAULT_EXPORT_CONTAINERS.flatMap((container) =>
      container.slots.map((slot) =>
        specimenAssembleTransformer({
          container,
          slot,
          rendered: {
            text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
            params: [{ name: 'value', type: 'number' }],
            declarations: [],
          },
          focusKind: 'statement',
          resultType: 'string',
          entryName: 'ifEntry',
        }),
      ),
    );

    expect(results).toStrictEqual([
      [
        'const ifEntry = (value: number): string => {',
        '    if (value > 5) {',
        "        return 'then';",
        '    }',
        "    return 'else';",
        '};',
        '',
        'export default ifEntry;',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {object-literal, slot method} => keeps only the method member and removes $params from the other callables', () => {
    const results = OBJECT_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'method')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: {
              text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
              params: [{ name: 'value', type: 'number' }],
              declarations: [],
            },
            focusKind: 'statement',
            resultType: 'string',
            entryName: 'ifObject',
          }),
        ),
    );

    expect(results).toStrictEqual([
      [
        'export const ifObject = {',
        '    run(value: number): string {',
        '        if (value > 5) {',
        "            return 'then';",
        '        }',
        "        return 'else';",
        '    },',
        '};',
        '',
      ].join('\n'),
    ]);
  });

  it('VALID: {object-literal, slot property} => keeps only the property member', () => {
    const results = OBJECT_CONTAINERS.flatMap((container) =>
      container.slots
        .filter((slot) => slot.name === 'property')
        .map((slot) =>
          specimenAssembleTransformer({
            container,
            slot,
            rendered: { text: 'Number(process.argv[2])', params: [], declarations: [] },
            focusKind: 'expression',
            resultType: 'number',
            entryName: 'valueObject',
          }),
        ),
    );

    expect(results).toStrictEqual(['export const valueObject = {\n    label: Number(process.argv[2]),\n};\n']);
  });

  it('ERROR: {a statement focus in an expression slot} => throws and says to plan an expression focus', () => {
    expect(() =>
      MODULE_EXPRESSION_PAIRS.map(({ container, slot }) =>
        specimenAssembleTransformer({
          container,
          slot,
          rendered: { text: "return 'x';", params: [], declarations: [] },
          focusKind: 'statement',
          resultType: 'string',
          entryName: 'moduleValue',
        }),
      ),
    ).toThrow(
      /^The slot 'exported-const' of the container 'module' is an expression slot, so a statement focus cannot go in it\. Plan an expression focus for this slot\.$/u,
    );
  });

  it('ERROR: {a statement slot whose marker is used as a value} => throws and says how to write the marker', () => {
    expect(() =>
      MISUSED_PAIRS.map(({ container, slot }) =>
        specimenAssembleTransformer({
          container,
          slot,
          rendered: { text: "return 'x';", params: [], declarations: [] },
          focusKind: 'statement',
          resultType: 'string',
          entryName: 'misused',
        }),
      ),
    ).toThrow(
      /^The slot 'body' of the container 'misused' is a statement slot, but its marker is used as an expression\. Write the marker as its own statement, \$stmts\('body'\);, or as the value of a return\.$/u,
    );
  });

  it('ERROR: {a container whose code is not a block} => throws and says to write a block', () => {
    expect(() =>
      EXPRESSION_BODY_PAIRS.map(({ container, slot }) =>
        specimenAssembleTransformer({
          container,
          slot,
          rendered: { text: 'Number(process.argv[2])', params: [], declarations: [] },
          focusKind: 'expression',
          resultType: 'number',
          entryName: 'whole',
        }),
      ),
    ).toThrow(
      /^The container 'expression-body' must write its code as a block, such as code: \(\) => \{ \.\.\. \}\. Change the arrow function body to a block\.$/u,
    );
  });
});

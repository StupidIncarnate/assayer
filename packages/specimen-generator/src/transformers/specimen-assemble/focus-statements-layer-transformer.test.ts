import ts from '#gateway/npm/typescript';

import { containerShapeTransformer } from '../container-shape/container-shape-transformer';
import { focusStatementsLayerTransformer } from './focus-statements-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

const FUNCTION_PAIRS = [
  ts.createSourceFile(
    'function.container.ts',
    `export const functionContainer = container({
  code: () => {
    function $Entry($params: never): $R {
      $stmts('body');
    }
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
]
  .map((sourceFile) =>
    containerShapeTransformer({
      sourceFile,
      declared: { description: 'a function', slots: { body: { reach: 'call', arm: 'return' } } },
      name: 'function',
    }),
  )
  .flatMap((container) => container.slots.map((slot) => ({ container, slot })));

const MODULE_PAIRS = [
  ts.createSourceFile(
    'module.container.ts',
    `export const moduleContainer = container({
  code: () => {
    $stmts('statement');
  },
});
`,
    ts.ScriptTarget.ES2022,
    true,
  ),
]
  .map((sourceFile) =>
    containerShapeTransformer({
      sourceFile,
      declared: { description: 'a module', slots: { statement: { reach: 'module-load', arm: 'log' } } },
      name: 'module',
    }),
  )
  .flatMap((container) => container.slots.map((slot) => ({ container, slot })));

const GENERATOR_PAIRS = [
  ts.createSourceFile(
    'generator.container.ts',
    `export const generatorContainer = container({
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
]
  .map((sourceFile) =>
    containerShapeTransformer({
      sourceFile,
      declared: { description: 'a generator', slots: { body: { reach: 'call-and-iterate', arm: 'yield' } } },
      name: 'generator',
    }),
  )
  .flatMap((container) => container.slots.map((slot) => ({ container, slot })));

const NO_ARM_PAIRS = FUNCTION_PAIRS.map(({ container, slot }) => ({
  container,
  slot: { name: slot.name, kind: slot.kind, reach: slot.reach, marker: slot.marker, hasParams: slot.hasParams },
}));

describe('focusStatementsLayerTransformer', () => {
  it('VALID: {a statement focus} => returns the statements as they are', () => {
    const results = FUNCTION_PAIRS.flatMap(({ container, slot }) =>
      focusStatementsLayerTransformer({
        container,
        slot,
        text: "if (value > 5) {\n    return 'then';\n}\nreturn 'else';",
        focusKind: 'statement',
      }).map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE)),
    );

    expect(results).toStrictEqual(["if (value > 5) {\n    return 'then';\n}", "return 'else';"]);
  });

  it('VALID: {an expression focus, arm: return} => wraps it in a return', () => {
    const results = FUNCTION_PAIRS.flatMap(({ container, slot }) =>
      focusStatementsLayerTransformer({ container, slot, text: 'value > 5', focusKind: 'expression' }).map(
        (statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE),
      ),
    );

    expect(results).toStrictEqual(['return value > 5;']);
  });

  it('VALID: {an expression focus, arm: log} => wraps it in console.log', () => {
    const results = MODULE_PAIRS.flatMap(({ container, slot }) =>
      focusStatementsLayerTransformer({ container, slot, text: 'value > 5', focusKind: 'expression' }).map(
        (statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE),
      ),
    );

    expect(results).toStrictEqual(['console.log(value > 5);']);
  });

  it('VALID: {an expression focus, arm: yield} => wraps it in yield', () => {
    const results = GENERATOR_PAIRS.flatMap(({ container, slot }) =>
      focusStatementsLayerTransformer({ container, slot, text: 'value > 5', focusKind: 'expression' }).map(
        (statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, OTHER_FILE),
      ),
    );

    expect(results).toStrictEqual(['yield value > 5;']);
  });

  it('ERROR: {an expression focus, the slot has no arm} => throws and says to add an arm', () => {
    expect(() =>
      NO_ARM_PAIRS.map(({ container, slot }) =>
        focusStatementsLayerTransformer({ container, slot, text: 'value > 5', focusKind: 'expression' }),
      ),
    ).toThrow(
      /^The slot 'body' of the container 'function' has no arm, so an expression focus cannot be wrapped into a statement\. Add arm to the slot, or plan the focus for an expression slot\.$/u,
    );
  });
});

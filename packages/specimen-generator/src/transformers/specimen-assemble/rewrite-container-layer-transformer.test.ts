import ts from '#gateway/npm/typescript';

import { containerShapeTransformer } from '../container-shape/container-shape-transformer';
import { rewriteContainerLayerTransformer } from './rewrite-container-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });

const FUNCTION_PAIRS = [
  ts.createSourceFile(
    'function.container.ts',
    `export const functionContainer = container({
  code: () => {
    function $Entry($params: never): $R {
      const inner = ($params: never) => 1;
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

const CONSTANT_PAIRS = [
  ts.createSourceFile(
    'constant.container.ts',
    `export const constantContainer = container({
  code: () => {
    const $Entry = $expr('value') * 2;
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
      declared: { description: 'a constant', slots: { value: { reach: 'module-load' } } },
      name: 'constant',
    }),
  )
  .flatMap((container) => container.slots.map((slot) => ({ container, slot })));

const DEFAULT_PAIRS = [
  ts.createSourceFile(
    'default.container.ts',
    `export const defaultContainer = container({
  code: () => {
    function $Entry($params: never): $R {
      $stmts('body');
    }
    $exportDefault($Entry);
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
      declared: { description: 'a default export', slots: { body: { reach: 'call', arm: 'return' } } },
      name: 'default',
    }),
  )
  .flatMap((container) => container.slots.map((slot) => ({ container, slot })));

const MISUSED_PAIRS = [
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
]
  .map((sourceFile) =>
    containerShapeTransformer({
      sourceFile,
      declared: { description: 'a marker used as a value', slots: { body: { reach: 'call', arm: 'return' } } },
      name: 'misused',
    }),
  )
  .flatMap((container) => container.slots.map((slot) => ({ container, slot })));

describe('rewriteContainerLayerTransformer', () => {
  it('VALID: {a statement slot} => writes the focus statements, the parameters and the result type, and removes $params from other callables', () => {
    const results = FUNCTION_PAIRS.flatMap(({ container, slot }) =>
      [
        rewriteContainerLayerTransformer({
          node: container.arrow.body,
          container,
          slot,
          params: [{ name: 'value', type: 'number' }],
          resultType: 'string',
          entryName: 'entry',
          focusStatements: [ts.factory.createReturnStatement(ts.factory.createStringLiteral('x', true))],
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .filter(ts.isBlock)
        .flatMap((block) => [...block.statements])
        .map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, container.sourceFile)),
    );

    expect(results).toStrictEqual([
      "export function entry(value: number): string {\n    const inner = () => 1;\n    return 'x';\n}",
    ]);
  });

  it('VALID: {an expression slot inside a product} => writes the focus expression and parenthesizes it where precedence needs it', () => {
    const results = CONSTANT_PAIRS.flatMap(({ container, slot }) =>
      [
        rewriteContainerLayerTransformer({
          node: container.arrow.body,
          container,
          slot,
          params: [],
          resultType: 'number',
          entryName: 'entry',
          focusStatements: [],
          focusExpression: ts.factory.createBinaryExpression(
            ts.factory.createNumericLiteral(1),
            ts.SyntaxKind.PlusToken,
            ts.factory.createNumericLiteral(2),
          ),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .filter(ts.isBlock)
        .flatMap((block) => [...block.statements])
        .map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, container.sourceFile)),
    );

    expect(results).toStrictEqual(['export const entry = (1 + 2) * 2;']);
  });

  it('VALID: {a container that exports by default} => writes export default for the entry and no export keyword on it', () => {
    const results = DEFAULT_PAIRS.flatMap(({ container, slot }) =>
      [
        rewriteContainerLayerTransformer({
          node: container.arrow.body,
          container,
          slot,
          params: [],
          resultType: 'string',
          entryName: 'entry',
          focusStatements: [ts.factory.createReturnStatement(ts.factory.createStringLiteral('x', true))],
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .filter(ts.isBlock)
        .flatMap((block) => [...block.statements])
        .map((statement) => PRINTER.printNode(ts.EmitHint.Unspecified, statement, container.sourceFile)),
    );

    expect(results).toStrictEqual(["function entry(): string {\n    return 'x';\n}", 'export default entry;']);
  });

  it('ERROR: {a statement slot whose marker is used as a value, no focus expression} => throws and names the slot and the fix', () => {
    expect(() =>
      MISUSED_PAIRS.map(({ container, slot }) =>
        rewriteContainerLayerTransformer({
          node: container.arrow.body,
          container,
          slot,
          params: [],
          resultType: 'string',
          entryName: 'entry',
          focusStatements: [],
        }),
      ),
    ).toThrow(
      /^The slot 'body' of the container 'misused' is a statement slot, but its marker is used as an expression\. Write the marker as its own statement, \$stmts\('body'\);, or as the value of a return\.$/u,
    );
  });
});

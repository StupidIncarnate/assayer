import ts from '#gateway/npm/typescript';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { swapHolesLayerTransformer } from './swap-holes-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });

const GT_PROGRAM = ProgramStub({
  code: `export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
});
`,
  fileName: 'gt.syntax.ts',
});
const GT_INSTANCES = GT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: GT_PROGRAM.getTypeChecker(),
        declared: { description: 'a value compared with a limit using >', code: () => true },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const NOT_PROGRAM = ProgramStub({
  code: `export const notSyntax = syntax({
  description: 'a negation',
  code: (value: boolean): boolean => !value,
});
`,
  fileName: 'not.syntax.ts',
});
const NOT_INSTANCES = NOT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: NOT_PROGRAM.getTypeChecker(),
        declared: { description: 'a negation', code: () => true },
        origin: 'syntax',
        typeArguments: ['boolean'],
      }),
    ],
  }),
);

const IF_PROGRAM = ProgramStub({
  code: `export const ifSyntax = syntax({
  description: 'an if statement whose else falls through to the code after it',
  code: <T>(cond: T): void => {
    if (cond) {
      $arm('then');
    }
    $arm('else');
  },
});
`,
  fileName: 'if.syntax.ts',
});
const IF_INSTANCES = IF_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: IF_PROGRAM.getTypeChecker(),
        declared: { description: 'an if statement', code: () => undefined },
        origin: 'syntax',
        typeArguments: ['boolean'],
      }),
    ],
  }),
);

const TERNARY_PROGRAM = ProgramStub({
  code: `export const ternarySyntax = syntax({
  description: 'a conditional expression',
  code: <T>(cond: T): string => (cond ? $arm('then') : $arm('else')),
});
`,
  fileName: 'ternary.syntax.ts',
});
const TERNARY_INSTANCES = TERNARY_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: TERNARY_PROGRAM.getTypeChecker(),
        declared: { description: 'a conditional expression', code: () => 'then' },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const LENGTH_PROGRAM = ProgramStub({
  code: `export const lengthSyntax = syntax({
  description: 'a hole named like a property',
  code: (length: number): number => other.length + length,
});
`,
  fileName: 'length.syntax.ts',
});
const LENGTH_INSTANCES = LENGTH_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: LENGTH_PROGRAM.getTypeChecker(),
        declared: { description: 'a hole named like a property', code: () => 0 },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const SHADOW_PROGRAM = ProgramStub({
  code: `export const shadowSyntax = syntax({
  description: 'an inner function with a parameter named like the hole',
  code: (value: number): number => ((value: number) => value)(value),
});
`,
  fileName: 'shadow.syntax.ts',
});
const SHADOW_INSTANCES = SHADOW_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: SHADOW_PROGRAM.getTypeChecker(),
        declared: { description: 'an inner function', code: () => 0 },
        origin: 'syntax',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const BAD_ARM_FILE = ts.createSourceFile('bad.ts', '$arm(name);', ts.ScriptTarget.ES2022, true);
const BAD_ARM_CALLS = GT_INSTANCES.flatMap((instance) =>
  BAD_ARM_FILE.statements.map((statement) => ({ instance, statement })),
);

describe('swapHolesLayerTransformer', () => {
  it('VALID: {gt, fills: value => x, limit => 5} => writes x > 5', () => {
    const results = GT_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['value', ts.factory.createIdentifier('x')], ['limit', ts.factory.createNumericLiteral(5)]]),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(['x > 5']);
  });

  it('VALID: {gt, value filled by a ?? b} => wraps the fill in parentheses where precedence needs them', () => {
    const results = GT_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([
            ['value', ts.factory.createBinaryExpression(ts.factory.createIdentifier('a'), ts.SyntaxKind.QuestionQuestionToken, ts.factory.createIdentifier('b'))],
            ['limit', ts.factory.createNumericLiteral(5)],
          ]),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(['(a ?? b) > 5']);
  });

  it('VALID: {not, value filled by x > 5} => writes !(x > 5)', () => {
    const results = NOT_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([
            ['value', ts.factory.createBinaryExpression(ts.factory.createIdentifier('x'), ts.SyntaxKind.GreaterThanToken, ts.factory.createNumericLiteral(5))],
          ]),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(['!(x > 5)']);
  });

  it('EDGE: {gt, no fills} => leaves the identifiers as they are', () => {
    const results = GT_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map(),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(['value > limit']);
  });

  it('EDGE: {a property named like the hole} => swaps the parameter and leaves the property name', () => {
    const results = LENGTH_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['length', ts.factory.createNumericLiteral(9)]]),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(['other.length + 9']);
  });

  it('EDGE: {an inner function with a parameter named like the hole} => swaps only the outer use', () => {
    const results = SHADOW_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['value', ts.factory.createNumericLiteral(7)]]),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(['((value: number) => value)(7)']);
  });

  it('VALID: {if, armKind: return} => writes return statements for the arms', () => {
    const results = IF_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['cond', ts.factory.createIdentifier('flag')]]),
            armKind: 'return',
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(["{\n    if (flag) {\n        return 'then';\n    }\n    return 'else';\n}"]);
  });

  it('VALID: {if, armKind: log} => writes log statements for the arms', () => {
    const results = IF_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['cond', ts.factory.createIdentifier('flag')]]),
            armKind: 'log',
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(["{\n    if (flag) {\n        console.log('then');\n    }\n    console.log('else');\n}"]);
  });

  it('VALID: {if, armKind: yield} => writes yield statements for the arms', () => {
    const results = IF_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['cond', ts.factory.createIdentifier('flag')]]),
            armKind: 'yield',
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(["{\n    if (flag) {\n        yield 'then';\n    }\n    yield 'else';\n}"]);
  });

  it('VALID: {ternary, no armKind} => writes the arms as strings, because an expression arm needs no statement slot', () => {
    const results = TERNARY_INSTANCES.flatMap((instance) =>
      [
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['cond', ts.factory.createIdentifier('flag')]]),
        }),
      ]
        .flat()
        .filter((node) => node !== undefined)
        .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, node, instance.syntax.sourceFile)),
    );

    expect(results).toStrictEqual(["(flag ? 'then' : 'else')"]);
  });

  it('ERROR: {if, an arm statement and no armKind} => throws and says the arm needs a statement slot', () => {
    expect(() =>
      IF_INSTANCES.map((instance) =>
        swapHolesLayerTransformer({
          node: instance.syntax.arrow.body,
          instance,
          fills: new Map<string, ts.Expression>([['cond', ts.factory.createIdentifier('flag')]]),
        }),
      ),
    ).toThrow(
      /^The arm 'then' of the syntax 'if-boolean' needs a statement slot, because it is written as a statement\. Put this syntax in a slot that has an arm, or use an expression syntax\.$/u,
    );
  });

  it('ERROR: {an $arm call whose argument is not a string literal} => throws and shows the right form', () => {
    expect(() =>
      BAD_ARM_CALLS.map(({ instance, statement }) =>
        swapHolesLayerTransformer({ node: statement, instance, fills: new Map() }),
      ),
    ).toThrow(
      /^The syntax 'gt-number' has an \$arm call without a string name\. Write \$arm\('then'\), for example\.$/u,
    );
  });
});

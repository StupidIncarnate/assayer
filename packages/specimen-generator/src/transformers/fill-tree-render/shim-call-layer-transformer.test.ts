import ts from '#gateway/npm/typescript';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { shimCallLayerTransformer } from './shim-call-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const EMPTY_FILE = ts.createSourceFile('x.ts', '', ts.ScriptTarget.ES2022, false);

const AT_PROGRAM = ProgramStub({
  code: `export const arrayAtShim = shim({
  description: 'reads one element of an array',
  builtin: 'Array.prototype.at',
  form: { kind: 'method', name: 'at' },
  code: <T>(receiver: readonly T[], index: number): T | undefined => receiver[index],
});
`,
  fileName: 'array-at.shim.ts',
});
const AT_INSTANCES = AT_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: AT_PROGRAM.getTypeChecker(),
        declared: {
          description: 'reads one element of an array',
          builtin: 'Array.prototype.at',
          form: { kind: 'method', name: 'at' },
          code: () => undefined,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const LENGTH_PROGRAM = ProgramStub({
  code: `export const arrayLengthShim = shim({
  description: 'the number of elements in an array',
  builtin: 'Array.prototype.length',
  form: { kind: 'getter', name: 'length' },
  code: <T>(receiver: readonly T[]): number => receiver.length,
});
`,
  fileName: 'array-length.shim.ts',
});
const LENGTH_INSTANCES = LENGTH_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: LENGTH_PROGRAM.getTypeChecker(),
        declared: {
          description: 'the number of elements in an array',
          builtin: 'Array.prototype.length',
          form: { kind: 'getter', name: 'length' },
          code: () => 0,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const RANDOM_PROGRAM = ProgramStub({
  code: `export const mathRandomShim = shim({
  description: 'a number from 0 up to 1',
  builtin: 'Math.random',
  form: { kind: 'call', name: 'Math.random' },
  code: (): number => 0.5,
});
`,
  fileName: 'math-random.shim.ts',
});
const RANDOM_INSTANCES = RANDOM_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: RANDOM_PROGRAM.getTypeChecker(),
        declared: {
          description: 'a number from 0 up to 1',
          builtin: 'Math.random',
          form: { kind: 'call', name: 'Math.random' },
          code: () => 0.5,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

const PLAIN_PROGRAM = ProgramStub({
  code: `export const parseShim = shim({
  description: 'reads a number',
  builtin: 'parseInt',
  form: { kind: 'call', name: 'parseInt' },
  code: (text: string, radix: number): number => radix,
});
`,
  fileName: 'parse.shim.ts',
});
const PLAIN_INSTANCES = PLAIN_PROGRAM.getSourceFiles().flatMap((sourceFile) =>
  syntaxInstancesTransformer({
    syntaxes: [
      syntaxShapeTransformer({
        sourceFile,
        checker: PLAIN_PROGRAM.getTypeChecker(),
        declared: {
          description: 'reads a number',
          builtin: 'parseInt',
          form: { kind: 'call', name: 'parseInt' },
          code: () => 0,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }),
    ],
  }),
);

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

describe('shimCallLayerTransformer', () => {
  it('VALID: {method shim at, fills: receiver, index} => writes receiver.at(index)', () => {
    const results = AT_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        shimCallLayerTransformer({
          instance,
          fills: [ts.factory.createIdentifier('receiver'), ts.factory.createIdentifier('index')],
        }),
        EMPTY_FILE,
      ),
    );

    expect(results).toStrictEqual(['receiver.at(index)']);
  });

  it('VALID: {method shim at, receiver is a binary expression} => wraps the receiver in parentheses', () => {
    const results = AT_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        shimCallLayerTransformer({
          instance,
          fills: [
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier('left'),
              ts.SyntaxKind.QuestionQuestionToken,
              ts.factory.createIdentifier('right'),
            ),
            ts.factory.createNumericLiteral(0),
          ],
        }),
        EMPTY_FILE,
      ),
    );

    expect(results).toStrictEqual(['(left ?? right).at(0)']);
  });

  it('VALID: {getter shim length, fills: receiver} => writes receiver.length', () => {
    const results = LENGTH_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        shimCallLayerTransformer({ instance, fills: [ts.factory.createIdentifier('receiver')] }),
        EMPTY_FILE,
      ),
    );

    expect(results).toStrictEqual(['receiver.length']);
  });

  it('VALID: {call shim Math.random, no fills} => writes Math.random()', () => {
    const results = RANDOM_INSTANCES.map((instance) =>
      PRINTER.printNode(ts.EmitHint.Unspecified, shimCallLayerTransformer({ instance, fills: [] }), EMPTY_FILE),
    );

    expect(results).toStrictEqual(['Math.random()']);
  });

  it('VALID: {call shim parseInt, fills: text, radix} => writes parseInt(text, radix)', () => {
    const results = PLAIN_INSTANCES.map((instance) =>
      PRINTER.printNode(
        ts.EmitHint.Unspecified,
        shimCallLayerTransformer({
          instance,
          fills: [ts.factory.createIdentifier('text'), ts.factory.createNumericLiteral(10)],
        }),
        EMPTY_FILE,
      ),
    );

    expect(results).toStrictEqual(['parseInt(text, 10)']);
  });

  it('ERROR: {a syntax that has no form} => throws and names the shim and the fix', () => {
    expect(() =>
      GT_INSTANCES.map((instance) => shimCallLayerTransformer({ instance, fills: [] })),
    ).toThrow(
      /^The shim 'gt' has no form, so the generator cannot write a call to it\. Add form: \{ kind, name \} to the shim declaration\.$/u,
    );
  });

  it('ERROR: {method shim with no fills} => throws and says the first hole is the receiver', () => {
    expect(() => AT_INSTANCES.map((instance) => shimCallLayerTransformer({ instance, fills: [] }))).toThrow(
      /^The shim 'array-at' is written as a method on its first hole, but it has no holes\. Add the receiver as the first parameter of its code\.$/u,
    );
  });
});

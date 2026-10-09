import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxShapeTransformer } from './syntax-shape-transformer';

const GT_SOURCE = `export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
  anchors: { limit: { number: 5, string: 'm' } },
});
`;

const IF_SOURCE = `export const ifSyntax = syntax({
  description: 'an if statement',
  code: <T>(cond: T): void => {
    if (cond) {
      $arm('then');
    }
    $arm('else');
  },
});
`;

describe('syntaxShapeTransformer', () => {
  describe('an expression syntax', () => {
    it('VALID: {gt, typeArguments: number, string, boolean} => reads holes, constraint and anchors', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: {
          description: 'a value compared with a limit using >',
          code: (value: number, limit: number) => value > limit,
          anchors: { limit: { number: 5, string: 'm' } },
        },
        origin: 'syntax',
        typeArguments: ['number', 'string', 'boolean'],
      }));

      expect(results.map(({ allowedTypeArguments, anchors, arms, holes, kind, name, origin, returnType, typeParameter }) => ({
        allowedTypeArguments,
        anchors,
        arms,
        holes: holes.map((hole) => ({ name: hole.name, type: hole.type })),
        kind,
        name,
        origin,
        returnType,
        typeParameter,
      }))).toStrictEqual([{
        allowedTypeArguments: ['number', 'string'],
        anchors: { limit: { number: 5, string: 'm' } },
        arms: [],
        holes: [
          { name: 'value', type: 'T' },
          { name: 'limit', type: 'T' },
        ],
        kind: 'expression',
        name: 'gt',
        origin: 'syntax',
        returnType: 'boolean',
        typeParameter: 'T',
      }]);
    });

    it('VALID: {gt, declared code} => the loaded code runs the declared function', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: {
          description: 'a value compared with a limit using >',
          code: (value: number, limit: number) => value > limit,
        },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(results.map(({ code }) => ([code(6, 5), code(4, 5)]))).toStrictEqual([[true, false]]);
    });

    it('VALID: {a ternary with two arms} => lists the arm names in source order', () => {
      const code = `export const ternarySyntax = syntax({
  description: 'a conditional expression',
  code: <T>(cond: T): string => (cond ? $arm('then') : $arm('else')),
});
`;
      const program = ProgramStub({ code, fileName: 'ternary.syntax.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'a conditional expression', code: () => 'then' },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(results.map(({ allowedTypeArguments, arms, kind, returnType }) => ({ allowedTypeArguments, arms, kind, returnType }))).toStrictEqual([{
        allowedTypeArguments: ['number'],
        arms: ['then', 'else'],
        kind: 'expression',
        returnType: 'string',
      }]);
    });

    it('VALID: {a syntax that is not generic} => has no type parameter and no allowed type arguments', () => {
      const code = `export const notSyntax = syntax({ description: 'a negation', code: (value: boolean): boolean => !value });\n`;
      const program = ProgramStub({ code, fileName: 'not.syntax.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'a negation', code: (value: boolean) => !value },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(results.map(({ allowedTypeArguments, holes, name, typeParameter }) => ({ allowedTypeArguments, holes: holes.map((hole) => hole.type), name, typeParameter }))).toStrictEqual([{
        allowedTypeArguments: [],
        holes: ['boolean'],
        name: 'not',
        typeParameter: undefined,
      }]);
    });

    it('VALID: {a generic syntax with no constraint} => every matrix type argument is allowed', () => {
      const code = `export const eqSyntax = syntax({ description: 'equal', code: <T>(a: T, b: T): boolean => a === b });\n`;
      const program = ProgramStub({ code, fileName: 'eq.syntax.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'equal', code: () => true },
        origin: 'syntax',
        typeArguments: ['number', 'string'],
      }));

      expect(results.map(({ allowedTypeArguments }) => (allowedTypeArguments))).toStrictEqual([['number', 'string']]);
    });
  });

  describe('a statement syntax', () => {
    it('VALID: {if with a block body and two arms} => kind is statement, returns void', () => {
      const program = ProgramStub({ code: IF_SOURCE, fileName: 'if.syntax.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'an if statement', code: () => undefined },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(results.map(({ arms, kind, returnType }) => ({ arms, kind, returnType }))).toStrictEqual([{
        arms: ['then', 'else'],
        kind: 'statement',
        returnType: 'void',
      }]);
    });
  });

  describe('a shim', () => {
    it('VALID: {a getter shim with a block body} => kind is expression, with form and builtin', () => {
      const code = `export const stringLengthShim = shim({
  description: 'the length of a string',
  builtin: 'String.prototype.length',
  form: { kind: 'getter', name: 'length' },
  code: (receiver: string): number => {
    return receiver.length;
  },
});
`;
      const program = ProgramStub({ code, fileName: 'string-length.shim.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: {
          description: 'the length of a string',
          builtin: 'String.prototype.length',
          form: { kind: 'getter', name: 'length' },
          code: (receiver: string) => receiver.length,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }));

      expect(results.map(({ builtin, form, kind, name, origin, returnType }) => ({ builtin, form, kind, name, origin, returnType }))).toStrictEqual([{
        builtin: 'String.prototype.length',
        form: { kind: 'getter', name: 'length' },
        kind: 'expression',
        name: 'string-length',
        origin: 'shim',
        returnType: 'number',
      }]);
    });

    it('VALID: {a call shim with a range and no inputs} => keeps the range', () => {
      const code = `export const mathRandomShim = shim({
  description: 'a random number',
  builtin: 'Math.random',
  form: { kind: 'call', name: 'Math.random' },
  range: { min: 0, max: 1, maxExclusive: true, whole: false },
  pin: 'range',
  code: (): number => 0.5,
});
`;
      const program = ProgramStub({ code, fileName: 'math-random.shim.ts' });

      const results = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: {
          description: 'a random number',
          builtin: 'Math.random',
          form: { kind: 'call', name: 'Math.random' },
          range: { min: 0, max: 1, maxExclusive: true, whole: false },
          pin: 'range',
          code: () => 0.5,
        },
        origin: 'shim',
        typeArguments: ['number'],
      }));

      expect(results.map(({ holes, range }) => ({ holes: holes.length, range }))).toStrictEqual([{
        holes: 0,
        range: { min: 0, max: 1, maxExclusive: true, whole: false },
      }]);
    });

    it('INVALID: {a method shim with no parameters} => throws that the receiver is missing', () => {
      const code = `export const aShim = shim({ code: (): number => 1 });\n`;
      const program = ProgramStub({ code, fileName: 'a.shim.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: {
            description: 'd',
            builtin: 'b',
            form: { kind: 'method', name: 'm' },
            code: () => 1,
          },
          origin: 'shim',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^a\.shim\.ts: a method shim's first parameter is the receiver, so code needs at least one parameter\. Add the receiver as the first parameter of code\.$/u,
      );
    });

    it('INVALID: {a getter shim with two parameters} => throws that a getter takes only the receiver', () => {
      const code = `export const aShim = shim({ code: (a: string, b: string): number => 1 });\n`;
      const program = ProgramStub({ code, fileName: 'a.shim.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: {
            description: 'd',
            builtin: 'b',
            form: { kind: 'getter', name: 'g' },
            code: () => 1,
          },
          origin: 'shim',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^a\.shim\.ts: a getter shim takes only the receiver, so code needs exactly one parameter\. Remove the other parameters\.$/u,
      );
    });

    it('INVALID: {a shim with a range and an input} => throws that a shim with inputs declares no range', () => {
      const code = `export const aShim = shim({ code: (a: number): number => a });\n`;
      const program = ProgramStub({ code, fileName: 'a.shim.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: {
            description: 'd',
            builtin: 'b',
            form: { kind: 'call', name: 'f' },
            range: { min: 0, max: 1, maxExclusive: true, whole: false },
            code: () => 1,
          },
          origin: 'shim',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^a\.shim\.ts: a shim with inputs computes its result from them, so it declares no range\. Remove the range, or remove the inputs\.$/u,
      );
    });

    it("INVALID: {pin: 'range' and no range} => throws that the pin needs a range", () => {
      const code = `export const aShim = shim({ code: (): number => 1 });\n`;
      const program = ProgramStub({ code, fileName: 'a.shim.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: {
            description: 'd',
            builtin: 'b',
            form: { kind: 'call', name: 'f' },
            pin: 'range',
            code: () => 1,
          },
          origin: 'shim',
          typeArguments: ['number'],
        })),
      ).toThrow(/^a\.shim\.ts: pin 'range' needs a range to pick values from\. Add a range, or use a pin function\.$/u);
    });
  });

  describe('refusals', () => {
    it('INVALID: {declared is not an object} => throws from the declared object check', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: undefined,
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: the export is not an object\. Export the result of calling the kit function for this declaration\.$/u,
      );
    });

    it('INVALID: {no code property in the file} => throws that code is missing', () => {
      const program = ProgramStub({ code: `export const gtSyntax = { description: 'x' };\n`, fileName: 'gt.syntax.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: has no `code` property that holds an arrow function\. Write the declaration code as an arrow function\.$/u,
      );
    });

    it('INVALID: {code is a function expression} => throws that code must be an arrow function', () => {
      const program = ProgramStub({
        code: `export const gtSyntax = { description: 'x', code: function (a: number): number { return a; } };\n`,
        fileName: 'gt.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: has no `code` property that holds an arrow function\. Write the declaration code as an arrow function\.$/u,
      );
    });

    it('INVALID: {a destructured parameter} => throws that every hole needs a plain name', () => {
      const program = ProgramStub({
        code: `export const gtSyntax = syntax({ code: ({ a }: { a: number }): number => a });\n`,
        fileName: 'gt.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: every parameter of `code` is a hole, so each one must be a plain name\. Replace the destructured parameter\.$/u,
      );
    });

    it('INVALID: {$arm called with a number} => throws that an arm needs a string name', () => {
      const program = ProgramStub({
        code: `export const ifSyntax = syntax({ code: (cond: boolean): void => { $arm(1); } });\n`,
        fileName: 'if.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^if\.syntax\.ts: every \$arm call needs a string literal name\. Write \$arm\('then'\), for example\.$/u,
      );
    });

    it('INVALID: {$arm called with no argument} => throws that an arm needs a string name', () => {
      const program = ProgramStub({
        code: `export const ifSyntax = syntax({ code: (cond: boolean): void => { $arm(); } });\n`,
        fileName: 'if.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^if\.syntax\.ts: every \$arm call needs a string literal name\. Write \$arm\('then'\), for example\.$/u,
      );
    });

    it('INVALID: {anchors name a parameter that is not a hole} => throws naming the anchor', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined, anchors: { limit: 5, other: 1 } },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: anchors names 'other', which is not a hole\. Name only parameters of code in anchors, or add the parameter to code\.$/u,
      );
    });

    it('INVALID: {two type parameters} => throws that at most one is supported', () => {
      const program = ProgramStub({
        code: `export const gtSyntax = syntax({ code: <A, B>(a: A, b: B): boolean => true });\n`,
        fileName: 'gt.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: code has 2 type parameters, and at most one is supported\. Keep one type parameter\.$/u,
      );
    });

    it('INVALID: {constraint allows none of the matrix types} => throws naming the constraint', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['boolean'],
        })),
      ).toThrow(
        /^gt\.syntax\.ts: no type argument satisfies T extends string \| number\. Loosen the constraint, or add a matching type to the matrix type arguments\.$/u,
      );
    });

    it('EMPTY: {a generic syntax with no constraint and no matrix types} => throws naming unknown', () => {
      const program = ProgramStub({
        code: `export const eqSyntax = syntax({ code: <T>(a: T): boolean => true });\n`,
        fileName: 'eq.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: [],
        })),
      ).toThrow(
        /^eq\.syntax\.ts: no type argument satisfies T extends unknown\. Loosen the constraint, or add a matching type to the matrix type arguments\.$/u,
      );
    });

    it('INVALID: {a block body that returns a value} => throws that a statement must not return', () => {
      const program = ProgramStub({
        code: `export const ifSyntax = syntax({ code: (a: number): number => { return a; } });\n`,
        fileName: 'if.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^if\.syntax\.ts: its code has a block body, which makes it a statement, but the block returns a value\. Write an expression as an expression body, such as \(a: number\): boolean => a > 5\.$/u,
      );
    });

    it('INVALID: {a block body typed number with no return} => throws that a statement returns void', () => {
      const program = ProgramStub({
        code: `export const ifSyntax = syntax({ code: (a: number): number => { a; } });\n`,
        fileName: 'if.syntax.ts',
      });

      expect(() =>
        program.getSourceFiles().map((sourceFile) =>
          syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'x', code: () => undefined },
          origin: 'syntax',
          typeArguments: ['number'],
        })),
      ).toThrow(
        /^if\.syntax\.ts: its code is a statement, so it must return void, not number\. Declare the return type as void\.$/u,
      );
    });
  });
});

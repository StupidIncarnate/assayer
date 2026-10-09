import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { syntaxInstancesTransformer } from './syntax-instances-transformer';

const GT_SOURCE = `export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
});
`;

const NOT_SOURCE = `export const notSyntax = syntax({ description: 'a negation', code: (value: boolean): boolean => !value });\n`;

const NULLISH_SOURCE = `export const nullishSyntax = syntax({
  description: 'a value defaulted with ??',
  code: <T>(value: T | undefined, fallback: T): T => value ?? fallback,
});
`;

describe('syntaxInstancesTransformer', () => {
  describe('a generic syntax', () => {
    it('VALID: {gt allowing number and string} => one instance per type argument with anchors resolved', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gt = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: {
          description: 'a value compared with a limit using >',
          code: () => true,
          anchors: { limit: { number: 5, string: 'm' } },
        },
        origin: 'syntax',
        typeArguments: ['string', 'number'],
      }));

      const result = syntaxInstancesTransformer({ syntaxes: gt });

      expect(
        result.map(({ anchors, holes, label, returnType, typeArgument }) => ({
          anchors,
          holes: holes.map((hole) => ({ name: hole.name, type: hole.type })),
          label,
          returnType,
          typeArgument,
        })),
      ).toStrictEqual([
        {
          anchors: { limit: 5 },
          holes: [
            { name: 'value', type: 'number' },
            { name: 'limit', type: 'number' },
          ],
          label: 'gt-number',
          returnType: 'boolean',
          typeArgument: 'number',
        },
        {
          anchors: { limit: 'm' },
          holes: [
            { name: 'value', type: 'string' },
            { name: 'limit', type: 'string' },
          ],
          label: 'gt-string',
          returnType: 'boolean',
          typeArgument: 'string',
        },
      ]);
    });

    it('VALID: {nullish allowing number} => replaces the type parameter inside unions and the return type', () => {
      const program = ProgramStub({ code: NULLISH_SOURCE, fileName: 'nullish.syntax.ts' });
      const nullish = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: {
          description: 'a value defaulted with ??',
          code: () => 0,
          anchors: { fallback: { number: 0, string: '' } },
        },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      const result = syntaxInstancesTransformer({ syntaxes: nullish });

      expect(
        result.map(({ anchors, holes, label, returnType }) => ({
          anchors,
          holes: holes.map((hole) => hole.type),
          label,
          returnType,
        })),
      ).toStrictEqual([
        { anchors: { fallback: 0 }, holes: ['number | undefined', 'number'], label: 'nullish-number', returnType: 'number' },
      ]);
    });

    it('VALID: {an anchor on a hole that does not mention the type parameter} => keeps the anchor value', () => {
      const code = `export const aSyntax = syntax({ code: <T>(value: T, count: number): boolean => true });\n`;
      const program = ProgramStub({ code, fileName: 'a.syntax.ts' });
      const syntax = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'd', code: () => true, anchors: { count: 3 } },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      const result = syntaxInstancesTransformer({ syntaxes: syntax });

      expect(result.map(({ anchors, label }) => ({ anchors, label }))).toStrictEqual([
        { anchors: { count: 3 }, label: 'a-number' },
      ]);
    });

    it('INVALID: {anchor has no value for the type argument} => throws naming the hole and the type', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gt = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'd', code: () => true, anchors: { limit: { string: 'm' } } },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(() => syntaxInstancesTransformer({ syntaxes: gt })).toThrow(
        /^gt\.syntax\.ts: hole 'limit' has type T, so its anchor must give a value for each type argument\. It has none for number\. Add number: <value> to the anchor of 'limit'\.$/u,
      );
    });

    it('INVALID: {anchor is a plain number on a generic hole} => throws naming the hole and the type', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gt = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'd', code: () => true, anchors: { limit: 5 } },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(() => syntaxInstancesTransformer({ syntaxes: gt })).toThrow(
        /^gt\.syntax\.ts: hole 'limit' has type T, so its anchor must give a value for each type argument\. It has none for number\. Add number: <value> to the anchor of 'limit'\.$/u,
      );
    });

    it('INVALID: {anchor is null on a generic hole} => throws naming the hole and the type', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gt = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'd', code: () => true, anchors: { limit: null } },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(() => syntaxInstancesTransformer({ syntaxes: gt })).toThrow(
        /^gt\.syntax\.ts: hole 'limit' has type T, so its anchor must give a value for each type argument\. It has none for number\. Add number: <value> to the anchor of 'limit'\.$/u,
      );
    });

    it('INVALID: {anchor is an array on a generic hole} => throws naming the hole and the type', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gt = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'd', code: () => true, anchors: { limit: [5] } },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      expect(() => syntaxInstancesTransformer({ syntaxes: gt })).toThrow(
        /^gt\.syntax\.ts: hole 'limit' has type T, so its anchor must give a value for each type argument\. It has none for number\. Add number: <value> to the anchor of 'limit'\.$/u,
      );
    });
  });

  describe('a syntax that is not generic', () => {
    it('VALID: {not} => one plain instance labelled with the name', () => {
      const program = ProgramStub({ code: NOT_SOURCE, fileName: 'not.syntax.ts' });
      const not = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: program.getTypeChecker(),
        declared: { description: 'a negation', code: () => true },
        origin: 'syntax',
        typeArguments: ['number'],
      }));

      const result = syntaxInstancesTransformer({ syntaxes: not });

      expect(
        result.map(({ anchors, holes, label, returnType, typeArgument }) => ({
          anchors,
          holes: holes.map((hole) => hole.type),
          label,
          returnType,
          typeArgument,
        })),
      ).toStrictEqual([
        { anchors: {}, holes: ['boolean'], label: 'not', returnType: 'boolean', typeArgument: undefined },
      ]);
    });
  });

  describe('ordering and empty input', () => {
    it('VALID: {not listed before gt} => sorts every instance by label', () => {
      const notProgram = ProgramStub({ code: NOT_SOURCE, fileName: 'not.syntax.ts' });
      const not = notProgram.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: notProgram.getTypeChecker(),
        declared: { description: 'a negation', code: () => true },
        origin: 'syntax',
        typeArguments: ['number'],
      }));
      const gtProgram = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gt = gtProgram.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
        sourceFile,
        checker: gtProgram.getTypeChecker(),
        declared: {
          description: 'd',
          code: () => true,
          anchors: { limit: { number: 5, string: 'm' } },
        },
        origin: 'syntax',
        typeArguments: ['string', 'number'],
      }));

      const result = syntaxInstancesTransformer({ syntaxes: [...not, ...gt] });

      expect(result.map(({ label }) => label)).toStrictEqual(['gt-number', 'gt-string', 'not']);
    });

    it('EMPTY: {syntaxes: []} => returns no instances', () => {
      const result = syntaxInstancesTransformer({ syntaxes: [] });

      expect(result).toStrictEqual([]);
    });
  });
});

import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

import { syntaxInstancesTransformer } from '../syntax-instances/syntax-instances-transformer';
import { syntaxShapeTransformer } from '../syntax-shape/syntax-shape-transformer';
import { fillTreeFactsTransformer } from './fill-tree-facts-transformer';

const GT_SOURCE = `export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
});
`;

const AND_SOURCE = `export const andSyntax = syntax({ description: 'both true', code: (left: boolean, right: boolean): boolean => left && right });\n`;

describe('fillTreeFactsTransformer', () => {
  describe('a leaf', () => {
    it('VALID: {a param leaf} => returns no uses and that provenance', () => {
      const result = fillTreeFactsTransformer({
        tree: { kind: 'leaf', owner: 'gt-number', hole: 'value', type: 'number', provenance: 'param', value: 0 },
      });

      expect(result).toStrictEqual({ uses: [], provenances: ['param'] });
    });
  });

  describe('a node', () => {
    it('VALID: {gt with a param value and a const limit} => returns gt and both provenances in hole order', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const syntaxes = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'a value compared with a limit using >', code: () => true, anchors: { limit: { number: 5 } } },
          origin: 'syntax',
          typeArguments: ['number'],
        }),
      );

      const result = syntaxInstancesTransformer({ syntaxes }).map((instance) =>
        fillTreeFactsTransformer({
          tree: {
            kind: 'node',
            instance,
            holes: {
              limit: { kind: 'leaf', owner: 'gt-number', hole: 'limit', type: 'number', provenance: 'const', value: 5 },
              value: { kind: 'leaf', owner: 'gt-number', hole: 'value', type: 'number', provenance: 'param', value: 0 },
            },
          },
        }),
      );

      expect(result).toStrictEqual([{ uses: ['gt'], provenances: ['param', 'const'] }]);
    });

    it('VALID: {and holding two gt nodes} => returns each name once, the outer first', () => {
      const gtProgram = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const gtSyntaxes = gtProgram.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
          sourceFile,
          checker: gtProgram.getTypeChecker(),
          declared: { description: 'a value compared with a limit using >', code: () => true, anchors: { limit: { number: 5 } } },
          origin: 'syntax',
          typeArguments: ['number'],
        }),
      );
      const andProgram = ProgramStub({ code: AND_SOURCE, fileName: 'and.syntax.ts' });
      const andSyntaxes = andProgram.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
          sourceFile,
          checker: andProgram.getTypeChecker(),
          declared: { description: 'both true', code: () => true },
          origin: 'syntax',
          typeArguments: [],
        }),
      );

      const result = syntaxInstancesTransformer({ syntaxes: andSyntaxes }).flatMap((and) =>
        syntaxInstancesTransformer({ syntaxes: gtSyntaxes }).map((gt) =>
          fillTreeFactsTransformer({
            tree: {
              kind: 'node',
              instance: and,
              holes: {
                left: {
                  kind: 'node',
                  instance: gt,
                  holes: {
                    value: { kind: 'leaf', owner: 'gt-number', hole: 'value', type: 'number', provenance: 'env', value: 0 },
                    limit: { kind: 'leaf', owner: 'gt-number', hole: 'limit', type: 'number', provenance: 'literal', value: 5 },
                  },
                },
                right: {
                  kind: 'node',
                  instance: gt,
                  holes: {
                    value: { kind: 'leaf', owner: 'gt-number', hole: 'value', type: 'number', provenance: 'param', value: 0 },
                    limit: { kind: 'leaf', owner: 'gt-number', hole: 'limit', type: 'number', provenance: 'const', value: 5 },
                  },
                },
              },
            },
          }),
        ),
      );

      expect(result).toStrictEqual([
        { uses: ['and', 'gt'], provenances: ['env', 'literal', 'param', 'const'] },
      ]);
    });

    it('EMPTY: {a node whose holes have no fill} => skips the holes', () => {
      const program = ProgramStub({ code: GT_SOURCE, fileName: 'gt.syntax.ts' });
      const syntaxes = program.getSourceFiles().map((sourceFile) =>
        syntaxShapeTransformer({
          sourceFile,
          checker: program.getTypeChecker(),
          declared: { description: 'a value compared with a limit using >', code: () => true, anchors: { limit: { number: 5 } } },
          origin: 'syntax',
          typeArguments: ['number'],
        }),
      );

      const result = syntaxInstancesTransformer({ syntaxes }).map((instance) =>
        fillTreeFactsTransformer({ tree: { kind: 'node', instance, holes: {} } }),
      );

      expect(result).toStrictEqual([{ uses: ['gt'], provenances: [] }]);
    });
  });
});

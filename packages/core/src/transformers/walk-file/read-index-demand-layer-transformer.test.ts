import type { Node } from '#gateway/npm/ts-morph';
import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readIndexDemandLayerTransformer } from './read-index-demand-layer-transformer';
import { readIndexDemandLayerTransformerProxy } from './read-index-demand-layer-transformer.proxy';

const nodeOf = ({ source }: { source: string }): Node => {
  const file = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() })
    .createSourceFile('src/x.ts', source);
  const call = file.getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (call !== undefined) {
    return call;
  }
  return file.getFirstDescendantByKindOrThrow(SyntaxKind.ElementAccessExpression);
};

describe('readIndexDemandLayerTransformer', () => {
  describe('param-index', () => {
    it('VALID: {a call to .at(index) where index is a parameter} => param-index demand', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source: 'export const elementAt = (items: number[], index: number): number | undefined => items.at(index);',
        }),
      });

      expect(result).toStrictEqual({
        kind: 'param-index',
        param: 'index',
        operation: 'at',
      });
    });

    it('VALID: {a bracket access [index] where index is a parameter} => param-index demand', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source: 'export const elementBracket = (items: number[], index: number): number | undefined => items[index];',
        }),
      });

      expect(result).toStrictEqual({
        kind: 'param-index',
        param: 'index',
        operation: 'bracket',
      });
    });
  });

  describe('array-length-index', () => {
    it('VALID: {local variable initialized to array.length used in [a, b, c].at(some)} => array-length-index demand', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source:
            'export const pick = (someArr: number[]): number | undefined => {\n' +
            '  const some = someArr.length;\n' +
            '  return [10, 20, 30].at(some);\n' +
            '};',
        }),
      });

      expect(result).toStrictEqual({
        kind: 'array-length-index',
        arrayParam: 'someArr',
        targetLength: 3,
        operation: 'at',
      });
    });

    it('VALID: {direct array.length used as index in [a, b, c].at(someArr.length)} => array-length-index demand', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source:
            'export const pick = (someArr: number[]): number | undefined => {\n' +
            '  return [10, 20, 30].at(someArr.length);\n' +
            '};',
        }),
      });

      expect(result).toStrictEqual({
        kind: 'array-length-index',
        arrayParam: 'someArr',
        targetLength: 3,
        operation: 'at',
      });
    });

    it('VALID: {receiver is a const variable initialized to array literal with 3 elements} => array-length-index demand', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source:
            'export const pick = (someArr: number[]): number | undefined => {\n' +
            '  const target = [10, 20, 30];\n' +
            '  const some = someArr.length;\n' +
            '  return target.at(some);\n' +
            '};',
        }),
      });

      expect(result).toStrictEqual({
        kind: 'array-length-index',
        arrayParam: 'someArr',
        targetLength: 3,
        operation: 'at',
      });
    });
  });

  describe('unmatched expressions', () => {
    it('EMPTY: {target array has fewer than 3 elements} => undefined', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source:
            'export const pick = (someArr: number[]): number | undefined => {\n' +
            '  return [10, 20].at(someArr.length);\n' +
            '};',
        }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {call is not .at or bracket} => undefined', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source: 'export const sliceIt = (items: number[], index: number): number[] => items.slice(index);',
        }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {index is a literal number} => undefined', () => {
      readIndexDemandLayerTransformerProxy();

      const result = readIndexDemandLayerTransformer({
        node: nodeOf({
          source: 'export const first = (items: number[]): number | undefined => items.at(0);',
        }),
      });

      expect(result).toBe(undefined);
    });
  });
});

import ts from '#gateway/npm/typescript';

import { literalNodeLayerTransformer } from './literal-node-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const EMPTY_FILE = ts.createSourceFile('x.ts', '', ts.ScriptTarget.ES2022, false);

describe('literalNodeLayerTransformer', () => {
  describe('numbers', () => {
    it('VALID: {value: 3} => writes 3', () => {
      const node = literalNodeLayerTransformer({ value: 3 });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('3');
    });

    it('VALID: {value: 0} => writes 0', () => {
      const node = literalNodeLayerTransformer({ value: 0 });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('0');
    });

    it('VALID: {value: -7} => writes a minus sign before 7', () => {
      const node = literalNodeLayerTransformer({ value: -7 });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('-7');
    });
  });

  describe('strings', () => {
    it('VALID: {value: "abc"} => writes the string with single quotes', () => {
      const node = literalNodeLayerTransformer({ value: 'abc' });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe("'abc'");
    });

    it('EMPTY: {value: ""} => writes an empty single-quoted string', () => {
      const node = literalNodeLayerTransformer({ value: '' });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe("''");
    });
  });

  describe('booleans', () => {
    it('VALID: {value: true} => writes true', () => {
      const node = literalNodeLayerTransformer({ value: true });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('true');
    });

    it('VALID: {value: false} => writes false', () => {
      const node = literalNodeLayerTransformer({ value: false });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('false');
    });
  });

  describe('arrays', () => {
    it('VALID: {value: [10, 20, 30]} => writes the array with each item', () => {
      const node = literalNodeLayerTransformer({ value: [10, 20, 30] });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('[10, 20, 30]');
    });

    it('EMPTY: {value: []} => writes an empty array', () => {
      const node = literalNodeLayerTransformer({ value: [] });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe('[]');
    });

    it('VALID: {value: [["a"], [-1]]} => writes nested arrays', () => {
      const node = literalNodeLayerTransformer({ value: [['a'], [-1]] });

      expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, EMPTY_FILE)).toBe("[['a'], [-1]]");
    });
  });

  describe('values with no code form', () => {
    it('ERROR: {value: null} => throws and names the value and where to fix it', () => {
      expect(() => literalNodeLayerTransformer({ value: null })).toThrow(
        /^The generator has no way to write null as code\. A known value must be a number, a string, a boolean, or an array of those\. Change the known value of this type in typeListStatics\.$/u,
      );
    });
  });
});

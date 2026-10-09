import ts from '#gateway/npm/typescript';

import { parseTypeLayerTransformer } from './parse-type-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('parseTypeLayerTransformer', () => {
  it('VALID: {text: "string"} => prints string', () => {
    const node = parseTypeLayerTransformer({ text: 'string' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('string');
  });

  it('VALID: {text: "readonly number[]"} => prints the readonly array type', () => {
    const node = parseTypeLayerTransformer({ text: 'readonly number[]' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('readonly number[]');
  });

  it('VALID: {text: "number | undefined"} => prints the union', () => {
    const node = parseTypeLayerTransformer({ text: 'number | undefined' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('number | undefined');
  });

  it('VALID: {text: "Generator<string>"} => prints the generic type', () => {
    const node = parseTypeLayerTransformer({ text: 'Generator<string>' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('Generator<string>');
  });
});

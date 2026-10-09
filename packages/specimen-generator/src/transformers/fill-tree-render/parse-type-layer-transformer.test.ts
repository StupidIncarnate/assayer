import ts from '#gateway/npm/typescript';

import { parseTypeLayerTransformer } from './parse-type-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('parseTypeLayerTransformer', () => {
  it('VALID: {text: "number"} => prints number', () => {
    const node = parseTypeLayerTransformer({ text: 'number' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('number');
  });

  it('VALID: {text: "readonly number[]"} => prints the readonly array type', () => {
    const node = parseTypeLayerTransformer({ text: 'readonly number[]' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('readonly number[]');
  });

  it('VALID: {text: "string | undefined"} => prints the union', () => {
    const node = parseTypeLayerTransformer({ text: 'string | undefined' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('string | undefined');
  });

  it('VALID: {text: a string literal type in double quotes} => prints it with single quotes', () => {
    const node = parseTypeLayerTransformer({ text: '"then" | "else"' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe("'then' | 'else'");
  });
});

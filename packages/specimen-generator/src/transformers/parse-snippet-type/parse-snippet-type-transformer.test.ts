import ts from '#gateway/npm/typescript';

import { parseSnippetTypeTransformer } from './parse-snippet-type-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('parseSnippetTypeTransformer', () => {
  it('VALID: {text: "number"} => prints number', () => {
    const node = parseSnippetTypeTransformer({ text: 'number' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('number');
  });

  it('VALID: {text: "readonly number[]"} => prints the readonly array type', () => {
    const node = parseSnippetTypeTransformer({ text: 'readonly number[]' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('readonly number[]');
  });

  it('VALID: {text: "string | undefined"} => prints the union', () => {
    const node = parseSnippetTypeTransformer({ text: 'string | undefined' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('string | undefined');
  });

  it('VALID: {text: "Generator<string>"} => prints the generic type', () => {
    const node = parseSnippetTypeTransformer({ text: 'Generator<string>' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('Generator<string>');
  });

  it('VALID: {text: a string literal type in double quotes} => prints it with single quotes', () => {
    const node = parseSnippetTypeTransformer({ text: '"then" | "else"' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe("'then' | 'else'");
  });
});

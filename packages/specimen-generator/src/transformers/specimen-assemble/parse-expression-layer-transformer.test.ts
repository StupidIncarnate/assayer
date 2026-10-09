import ts from '#gateway/npm/typescript';

import { parseExpressionLayerTransformer } from './parse-expression-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('parseExpressionLayerTransformer', () => {
  it('VALID: {text: "value > 5"} => returns a node that prints the same text', () => {
    const node = parseExpressionLayerTransformer({ text: 'value > 5' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe('value > 5');
  });

  it('VALID: {text with a double-quoted string} => prints the string with single quotes', () => {
    const node = parseExpressionLayerTransformer({ text: 'cond ? "then" : "else"' });

    expect(PRINTER.printNode(ts.EmitHint.Unspecified, node, OTHER_FILE)).toBe("cond ? 'then' : 'else'");
  });

  it('VALID: {text: "a === b ? 1 : 2"} => keeps the conditional as one expression', () => {
    const node = parseExpressionLayerTransformer({ text: 'a === b ? 1 : 2' });

    expect(ts.isConditionalExpression(node)).toBe(true);
  });
});

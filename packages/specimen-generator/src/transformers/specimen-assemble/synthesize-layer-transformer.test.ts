import ts from '#gateway/npm/typescript';

import { synthesizeLayerTransformer } from './synthesize-layer-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('synthesizeLayerTransformer', () => {
  it('VALID: {a double-quoted string in a call} => prints it with single quotes and never reads the snippet text', () => {
    const sourceFile = ts.createSourceFile('a.ts', 'const a = f("abc", 12);', ts.ScriptTarget.ES2022, true);

    const results = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations.map((declaration) => declaration.initializer))
      .filter((initializer) => initializer !== undefined)
      .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, synthesizeLayerTransformer({ node }), OTHER_FILE));

    expect(results).toStrictEqual(["f('abc', 12)"]);
  });

  it('VALID: {a statement with a block} => prints the block from its parts', () => {
    const sourceFile = ts.createSourceFile(
      'a.ts',
      'if (value > 5) {\n  return "then";\n}',
      ts.ScriptTarget.ES2022,
      true,
    );

    const results = sourceFile.statements.map((node) =>
      PRINTER.printNode(ts.EmitHint.Unspecified, synthesizeLayerTransformer({ node }), OTHER_FILE),
    );

    expect(results).toStrictEqual(["if (value > 5) {\n    return 'then';\n}"]);
  });

  it('VALID: {an identifier named KEY} => leaves it as it is', () => {
    const sourceFile = ts.createSourceFile('a.ts', 'const a = process.env.KEY;', ts.ScriptTarget.ES2022, true);

    const results = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations.map((declaration) => declaration.initializer))
      .filter((initializer) => initializer !== undefined)
      .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, synthesizeLayerTransformer({ node }), OTHER_FILE));

    expect(results).toStrictEqual(['process.env.KEY']);
  });
});

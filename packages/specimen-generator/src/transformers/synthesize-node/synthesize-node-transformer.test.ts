import ts from '#gateway/npm/typescript';

import { synthesizeNodeTransformer } from './synthesize-node-transformer';

const PRINTER = ts.createPrinter({ removeComments: true });
const OTHER_FILE = ts.createSourceFile('other.ts', 'x'.repeat(200), ts.ScriptTarget.ES2022, false);

describe('synthesizeNodeTransformer', () => {
  it('VALID: {a double-quoted string in a call} => prints it with single quotes and never reads the snippet text', () => {
    const sourceFile = ts.createSourceFile('a.ts', 'const a = f("abc", 12);', ts.ScriptTarget.ES2022, true);

    const results = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations.map((declaration) => declaration.initializer))
      .filter((initializer) => initializer !== undefined)
      .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, synthesizeNodeTransformer({ node }), OTHER_FILE));

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
      PRINTER.printNode(ts.EmitHint.Unspecified, synthesizeNodeTransformer({ node }), OTHER_FILE),
    );

    expect(results).toStrictEqual(["if (value > 5) {\n    return 'then';\n}"]);
  });

  it('VALID: {rename KEY to VALUE} => replaces the identifier everywhere it appears', () => {
    const sourceFile = ts.createSourceFile('a.ts', 'const a = Number(process.env.KEY);', ts.ScriptTarget.ES2022, true);

    const results = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations.map((declaration) => declaration.initializer))
      .filter((initializer) => initializer !== undefined)
      .map((node) =>
        PRINTER.printNode(
          ts.EmitHint.Unspecified,
          synthesizeNodeTransformer({ node, rename: { from: 'KEY', to: 'VALUE' } }),
          OTHER_FILE,
        ),
      );

    expect(results).toStrictEqual(['Number(process.env.VALUE)']);
  });

  it('VALID: {no rename given} => leaves a KEY identifier as it is', () => {
    const sourceFile = ts.createSourceFile('a.ts', 'const a = process.env.KEY;', ts.ScriptTarget.ES2022, true);

    const results = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations.map((declaration) => declaration.initializer))
      .filter((initializer) => initializer !== undefined)
      .map((node) => PRINTER.printNode(ts.EmitHint.Unspecified, synthesizeNodeTransformer({ node }), OTHER_FILE));

    expect(results).toStrictEqual(['process.env.KEY']);
  });

  it('VALID: {rename given, the node is a string literal} => returns the single-quoted string and does not rename it', () => {
    const sourceFile = ts.createSourceFile('a.ts', "const a = 'KEY';", ts.ScriptTarget.ES2022, true);

    const results = sourceFile.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => statement.declarationList.declarations.map((declaration) => declaration.initializer))
      .filter((initializer) => initializer !== undefined)
      .map((node) =>
        PRINTER.printNode(
          ts.EmitHint.Unspecified,
          synthesizeNodeTransformer({ node, rename: { from: 'KEY', to: 'VALUE' } }),
          OTHER_FILE,
        ),
      );

    expect(results).toStrictEqual(["'KEY'"]);
  });
});

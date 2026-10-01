import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readPropertyPathLayerTransformer } from './read-property-path-layer-transformer';
import { readPropertyPathLayerTransformerProxy } from './read-property-path-layer-transformer.proxy';

describe('readPropertyPathLayerTransformer', () => {
  it('VALID: {config.mode} => root is config and the chain is one member', () => {
    readPropertyPathLayerTransformerProxy();
    const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    const sourceFile = project.createSourceFile('src/f.ts', 'const x = config.mode;\n');
    const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAccessExpression);

    const result = readPropertyPathLayerTransformer({ node });

    expect({ root: result.root.getKindName(), rootName: result.root.getText(), path: result.path }).toStrictEqual({
      root: 'Identifier',
      rootName: 'config',
      path: ['mode'],
    });
  });

  it('VALID: {a.b.c} => root is a and the chain is the members in source order', () => {
    readPropertyPathLayerTransformerProxy();
    const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    const sourceFile = project.createSourceFile('src/f.ts', 'const x = a.b.c;\n');
    // Depth-first pre-order returns the OUTERMOST access `a.b.c` first, `(a.b).c` in AST form.
    const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.PropertyAccessExpression);

    const result = readPropertyPathLayerTransformer({ node });

    expect({ root: result.root.getText(), path: result.path }).toStrictEqual({
      root: 'a',
      path: ['b', 'c'],
    });
  });

  it('EDGE: {a bare identifier} => the node is its own root with an empty chain', () => {
    readPropertyPathLayerTransformerProxy();
    const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    const sourceFile = project.createSourceFile('src/f.ts', 'const flag = ready;\n');
    const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.Identifier);

    const result = readPropertyPathLayerTransformer({ node });

    expect({ root: result.root.getText(), path: result.path }).toStrictEqual({
      root: 'flag',
      path: [],
    });
  });
});

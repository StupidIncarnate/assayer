import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { unwrapParenthesesLayerTransformer } from './unwrap-parentheses-layer-transformer';
import { unwrapParenthesesLayerTransformerProxy } from './unwrap-parentheses-layer-transformer.proxy';

describe('unwrapParenthesesLayerTransformer', () => {
  it('VALID: {((a))} => the identifier a inside both pairs', () => {
    unwrapParenthesesLayerTransformerProxy();
    const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    const sourceFile = project.createSourceFile('src/f.ts', 'const a = 1;\nconst v = ((a));\n');
    const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

    const result = unwrapParenthesesLayerTransformer({ node });

    expect({ kind: result.getKindName(), start: result.getStart() }).toStrictEqual({
      kind: 'Identifier',
      start: node.getFirstDescendantByKindOrThrow(SyntaxKind.Identifier).getStart(),
    });
  });

  it('EMPTY: {a, no parentheses} => the same node', () => {
    unwrapParenthesesLayerTransformerProxy();
    const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    const sourceFile = project.createSourceFile('src/f.ts', 'const a = 1;\nconst v = a;\n');
    const node = sourceFile.getVariableDeclarationOrThrow('v').getInitializerOrThrow();

    expect(unwrapParenthesesLayerTransformer({ node })).toBe(node);
  });
});

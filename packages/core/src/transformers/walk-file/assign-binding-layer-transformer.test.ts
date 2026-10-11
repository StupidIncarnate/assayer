import { Project } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';
import { ValueExprStub } from '@assayer/shared/contracts/value-expr/value-expr.stub';

import { assignBindingLayerTransformer } from './assign-binding-layer-transformer';
import { assignBindingLayerTransformerProxy } from './assign-binding-layer-transformer.proxy';

const declarationOf = ({ source }: { source: string }): ReturnType<ReturnType<Project['createSourceFile']>['getVariableDeclarationOrThrow']> =>
  new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() })
    .createSourceFile('src/x.ts', source)
    .getVariableDeclarationOrThrow('data');

describe('assignBindingLayerTransformer', () => {
  it('VALID: {a tracked variable assigned a literal} => the variable holds the literal, keyed by its declaration', () => {
    assignBindingLayerTransformerProxy();
    const declaration = declarationOf({ source: 'function f(n: string) { let data = n; }\nlet data = 1;' });
    const initializer = declaration.getInitializerOrThrow();

    expect(
      assignBindingLayerTransformer({ before: {}, declaration, value: initializer, scopePath: ['f'], paramNames: new Set(['n']) }),
    ).toStrictEqual({ [String(declaration.getPos())]: ValueExprStub({ kind: 'lit', value: 1 }) });
  });

  it('VALID: {a value that cannot be expressed} => the old binding is dropped', () => {
    assignBindingLayerTransformerProxy();
    const declaration = declarationOf({ source: 'declare function opaque(): number;\nlet data = opaque();' });
    const key = String(declaration.getPos());

    expect(
      assignBindingLayerTransformer({
        before: { [key]: ValueExprStub({ kind: 'lit', value: 1 }) },
        declaration,
        value: declaration.getInitializerOrThrow(),
        scopePath: ['f'],
        paramNames: new Set(),
      }),
    ).toStrictEqual({});
  });

  it('EMPTY: {no value} => the old binding is dropped', () => {
    assignBindingLayerTransformerProxy();
    const declaration = declarationOf({ source: 'let data = 1;' });
    const key = String(declaration.getPos());

    expect(
      assignBindingLayerTransformer({
        before: { [key]: ValueExprStub({ kind: 'lit', value: 1 }) },
        declaration,
        value: undefined,
        scopePath: ['f'],
        paramNames: new Set(),
      }),
    ).toStrictEqual({});
  });
});

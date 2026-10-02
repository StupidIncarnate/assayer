import { Project, ScriptTarget } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { propertyNameTransformer } from './property-name-transformer';

const SOURCE =
  'declare const m: Map<string, number>;\nconst k: unique symbol = Symbol();\ndeclare const o: { [k]: 1; plain: 2; "dash-ed": 3 };\n';

describe('propertyNameTransformer', () => {
  it('VALID: {Map under an ES2022 library} => names its symbol-keyed members by their declared key', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
    });
    const names = project
      .createSourceFile('src/f.ts', SOURCE)
      .getVariableDeclarationOrThrow('m')
      .getType()
      .getProperties()
      .map((symbol) => propertyNameTransformer({ symbol }))
      .sort();

    expect(names).toStrictEqual([
      '[Symbol.iterator]',
      '[Symbol.toStringTag]',
      'clear',
      'delete',
      'entries',
      'forEach',
      'get',
      'has',
      'keys',
      'set',
      'size',
      'values',
    ]);
  });

  it('VALID: {a unique symbol key and plain keys} => names the symbol key by its const and keeps plain names', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
    });
    const names = project
      .createSourceFile('src/f.ts', SOURCE)
      .getVariableDeclarationOrThrow('o')
      .getType()
      .getProperties()
      .map((symbol) => propertyNameTransformer({ symbol }));

    expect(names).toStrictEqual(['plain', 'dash-ed', '[k]']);
  });

  it('VALID: {the same source read in two projects in one process} => gives identical names both times', () => {
    const first = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
    })
      .createSourceFile('src/f.ts', SOURCE)
      .getVariableDeclarationOrThrow('o')
      .getType()
      .getProperties()
      .map((symbol) => propertyNameTransformer({ symbol }));
    const second = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
    })
      .createSourceFile('src/f.ts', SOURCE)
      .getVariableDeclarationOrThrow('o')
      .getType()
      .getProperties()
      .map((symbol) => propertyNameTransformer({ symbol }));

    expect({ first, second }).toStrictEqual({ first: ['plain', 'dash-ed', '[k]'], second: ['plain', 'dash-ed', '[k]'] });
  });
});

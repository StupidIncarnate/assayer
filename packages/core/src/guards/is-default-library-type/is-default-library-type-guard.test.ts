import { Project, ScriptTarget } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { isDefaultLibraryTypeGuard } from './is-default-library-type-guard';

const SOURCE = [
  'interface Config { mode: string }',
  'interface Date { extra: number }',
  'declare const counts: Map<string, number>;',
  'declare const when: Date;',
  'declare const failure: Error;',
  'declare const config: Config;',
  'declare const partial: Partial<Config>;',
  'declare const both: Config & { extra: number };',
  '',
].join('\n');

describe('isDefaultLibraryTypeGuard', () => {
  it.each([
    ['counts', 'a library generic, Map<string, number>', true],
    ['failure', 'a library interface, Error', true],
    ['when', 'Date, which the source file augments', false],
    ['config', 'an interface the source file declares', false],
    ['partial', 'a library mapped type over a local interface, Partial<Config>', false],
    ['both', 'an intersection, which has no symbol', false],
  ] as const)('VALID: {%s: %s} => returns %s', (name, _description, expected) => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
    });
    const type = project.createSourceFile('src/f.ts', SOURCE).getVariableDeclarationOrThrow(name).getType();

    expect(isDefaultLibraryTypeGuard({ type })).toBe(expected);
  });

  it('EMPTY: {type: undefined} => returns false', () => {
    expect(isDefaultLibraryTypeGuard({})).toBe(false);
  });
});

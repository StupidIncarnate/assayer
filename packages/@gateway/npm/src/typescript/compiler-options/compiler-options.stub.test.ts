import { Project } from 'ts-morph';

import { ScriptTarget } from '../bundled-typescript/bundled-typescript';
import { CompilerOptionsStub } from './compiler-options.stub';

describe('CompilerOptionsStub', () => {
  it('VALID: {} => an ES5 target and the four libraries lib.d.ts references', () => {
    expect(CompilerOptionsStub()).toStrictEqual({
      target: ScriptTarget.ES5,
      lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
    });
  });

  it('VALID: {} => a program built with it loads the library files a program with no options loads, minus the lib.d.ts wrapper', () => {
    const statedProject = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    statedProject.createSourceFile('src/f.ts', 'export const n = 1;');
    const statedFiles = statedProject
      .getProgram()
      .compilerObject.getSourceFiles()
      .map((file) => file.fileName.slice(file.fileName.lastIndexOf('/') + 1))
      .sort();
    const defaultProject = new Project({ useInMemoryFileSystem: true });
    defaultProject.createSourceFile('src/f.ts', 'export const n = 1;');
    const defaultFiles = defaultProject
      .getProgram()
      .compilerObject.getSourceFiles()
      .map((file) => file.fileName.slice(file.fileName.lastIndexOf('/') + 1))
      .sort();

    expect({ statedFiles, defaultFiles }).toStrictEqual({
      statedFiles: [
        'f.ts',
        'lib.decorators.d.ts',
        'lib.decorators.legacy.d.ts',
        'lib.dom.d.ts',
        'lib.es5.d.ts',
        'lib.scripthost.d.ts',
        'lib.webworker.importscripts.d.ts',
      ],
      defaultFiles: [
        'f.ts',
        'lib.d.ts',
        'lib.decorators.d.ts',
        'lib.decorators.legacy.d.ts',
        'lib.dom.d.ts',
        'lib.es5.d.ts',
        'lib.scripthost.d.ts',
        'lib.webworker.importscripts.d.ts',
      ],
    });
  });

  it('VALID: {strict: true, target: ES2022} => the given fields replace or join the defaults', () => {
    expect(CompilerOptionsStub({ strict: true, target: ScriptTarget.ES2022 })).toStrictEqual({
      target: ScriptTarget.ES2022,
      lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
      strict: true,
    });
  });
});

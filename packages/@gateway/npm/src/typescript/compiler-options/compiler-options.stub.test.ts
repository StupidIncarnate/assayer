import { Project } from 'ts-morph';

import { ScriptTarget } from '../bundled-typescript/bundled-typescript';
import { CompilerOptionsStub } from './compiler-options.stub';

describe('CompilerOptionsStub', () => {
  it('VALID: {} => an ES2015 target, strict off, and the four libraries lib.d.ts references', () => {
    expect(CompilerOptionsStub()).toStrictEqual({
      target: ScriptTarget.ES2015,
      strict: false,
      lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
    });
  });

  // TypeScript 6's DOM library references ES2015, so the stated set loads ES2015 beside the four named files; it
  // still stops short of ES2022, so `Array.prototype.at` stays undeclared.
  it('VALID: {} => a program built with it loads the four libraries plus the ES2015 files the DOM library references', () => {
    const statedProject = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
    statedProject.createSourceFile('src/f.ts', 'export const n = 1;');
    const statedFiles = statedProject
      .getProgram()
      .compilerObject.getSourceFiles()
      .map((file) => file.fileName.slice(file.fileName.lastIndexOf('/') + 1))
      .sort();

    expect(statedFiles).toStrictEqual([
      'f.ts',
      'lib.decorators.d.ts',
      'lib.decorators.legacy.d.ts',
      'lib.dom.d.ts',
      'lib.es2015.collection.d.ts',
      'lib.es2015.core.d.ts',
      'lib.es2015.d.ts',
      'lib.es2015.generator.d.ts',
      'lib.es2015.iterable.d.ts',
      'lib.es2015.promise.d.ts',
      'lib.es2015.proxy.d.ts',
      'lib.es2015.reflect.d.ts',
      'lib.es2015.symbol.d.ts',
      'lib.es2015.symbol.wellknown.d.ts',
      'lib.es2018.asynciterable.d.ts',
      'lib.es5.d.ts',
      'lib.scripthost.d.ts',
      'lib.webworker.importscripts.d.ts',
    ]);
  });

  it('VALID: {strict: true, target: ES2022} => the given fields replace or join the defaults', () => {
    expect(CompilerOptionsStub({ strict: true, target: ScriptTarget.ES2022 })).toStrictEqual({
      target: ScriptTarget.ES2022,
      strict: true,
      lib: ['lib.es5.d.ts', 'lib.dom.d.ts', 'lib.webworker.importscripts.d.ts', 'lib.scripthost.d.ts'],
    });
  });
});

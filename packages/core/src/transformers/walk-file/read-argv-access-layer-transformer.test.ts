import { Project } from '#gateway/npm/ts-morph';
import type { Node } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readArgvAccessLayerTransformer } from './read-argv-access-layer-transformer';
import { readArgvAccessLayerTransformerProxy } from './read-argv-access-layer-transformer.proxy';

// The initializer of the file's `subject` const, parsed exactly as the walk parses: an in-memory
// project with the standard library and nothing else, so `process` resolves to no declaration.
const initializerOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);

  return sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();
};

describe('readArgvAccessLayerTransformer', () => {
  it('VALID: {process.argv[2]} => one element at index 2', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.argv[2];' }) });

    expect(result).toStrictEqual({ kind: 'argv', shape: 'element', index: 2 });
  });

  it('VALID: {process.argv.slice(2)} => the tail from index 2', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.argv.slice(2);' }) });

    expect(result).toStrictEqual({ kind: 'argv', shape: 'tail', index: 2 });
  });

  it('VALID: {process.argv itself} => nothing, since no entry is named', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.argv;' }) });

    expect(result).toBe(undefined);
  });

  it('VALID: {process.argv.slice(2, 3)} => nothing, since a second argument caps the tail', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.argv.slice(2, 3);' }) });

    expect(result).toBe(undefined);
  });

  it('VALID: {process.argv[i] with a variable index} => nothing', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const i = 2;\nconst subject = process.argv[i];' }) });

    expect(result).toBe(undefined);
  });

  it('VALID: {process.argv[1.5]} => nothing, since no entry has a fractional index', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.argv[1.5];' }) });

    expect(result).toBe(undefined);
  });

  it('VALID: {a process the file declares} => nothing, since that is not the runtime global', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({
      node: initializerOf({ source: "const process = { argv: ['a', 'b', 'c'] };\nconst subject = process.argv[2];" }),
    });

    expect(result).toBe(undefined);
  });

  it('VALID: {process.env[2]} => nothing, since that is no command-line read', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.env[2];' }) });

    expect(result).toBe(undefined);
  });

  it('VALID: {values.slice(2)} => nothing, since the receiver is not process.argv', () => {
    readArgvAccessLayerTransformerProxy();

    const result = readArgvAccessLayerTransformer({
      node: initializerOf({ source: "const values = ['a'];\nconst subject = values.slice(2);" }),
    });

    expect(result).toBe(undefined);
  });
});

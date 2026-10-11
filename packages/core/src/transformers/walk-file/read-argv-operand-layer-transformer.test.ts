import { Project } from '#gateway/npm/ts-morph';
import type { Node } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readArgvOperandLayerTransformer } from './read-argv-operand-layer-transformer';
import { readArgvOperandLayerTransformerProxy } from './read-argv-operand-layer-transformer.proxy';

// The initializer of the file's `subject` const, parsed exactly as the walk parses: an in-memory
// project with the standard library and nothing else, so `process` resolves to no declaration.
const initializerOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);

  return sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();
};

describe('readArgvOperandLayerTransformer', () => {
  it('VALID: {Number(process.argv[2])} => the element read with a number step', () => {
    readArgvOperandLayerTransformerProxy();

    const result = readArgvOperandLayerTransformer({ node: initializerOf({ source: 'const subject = Number(process.argv[2]);' }) });

    expect(result).toStrictEqual({ shape: 'element', index: 2, steps: [{ kind: 'number' }] });
  });

  it('VALID: {an identifier bound to process.argv.slice(2)} => the tail read, followed through the const', () => {
    readArgvOperandLayerTransformerProxy();

    const result = readArgvOperandLayerTransformer({
      node: initializerOf({ source: 'const rest = process.argv.slice(2);\nconst subject = rest;' }),
    });

    expect(result).toStrictEqual({ shape: 'tail', index: 2, steps: [] });
  });

  it('VALID: {process.env.MODE} => nothing, since that is an environment read', () => {
    readArgvOperandLayerTransformerProxy();

    const result = readArgvOperandLayerTransformer({ node: initializerOf({ source: 'const subject = process.env.MODE;' }) });

    expect(result).toBe(undefined);
  });

  it('VALID: {an opaque call} => nothing', () => {
    readArgvOperandLayerTransformerProxy();

    const result = readArgvOperandLayerTransformer({
      node: initializerOf({ source: 'const isReady = (): boolean => true;\nconst subject = isReady();' }),
    });

    expect(result).toBe(undefined);
  });
});

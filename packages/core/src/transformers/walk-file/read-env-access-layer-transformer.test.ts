import { Project } from '#gateway/npm/ts-morph';
import type { Node } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readEnvAccessLayerTransformer } from './read-env-access-layer-transformer';
import { readEnvAccessLayerTransformerProxy } from './read-env-access-layer-transformer.proxy';

// The initializer of the file's `subject` const, parsed exactly as the walk parses: an in-memory
// project with the standard library and nothing else, so `process` resolves to no declaration.
const initializerOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);

  return sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();
};

describe('readEnvAccessLayerTransformer', () => {
  describe('a read of the process environment', () => {
    it('VALID: {process.env.MODE} => the name with no steps', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.env.MODE;' }) });

      expect(result).toStrictEqual({ name: 'MODE', steps: [] });
    });

    it('VALID: {process.env["MODE"]} => the same name, since quote style is formatting', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.env["MODE"];' }) });

      expect(result).toStrictEqual({ name: 'MODE', steps: [] });
    });
  });

  describe('anything else', () => {
    it("EMPTY: {process.env['']} => nothing, since an empty key names no variable", () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({ node: initializerOf({ source: "const subject = process.env[''];" }) });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.env[key] with a computed key} => nothing', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({
        node: initializerOf({ source: "const key = 'MODE';\nconst subject = process.env[key];" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.env itself} => nothing, since no variable is read', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.env;' }) });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.argv.MODE} => nothing', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = process.argv.MODE;' }) });

      expect(result).toBe(undefined);
    });

    it('VALID: {a local process} => nothing, because this is not the runtime global', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({
        node: initializerOf({
          source: "export const q = 1;\nconst process = { env: { MODE: 'x' } };\nconst subject = process.env.MODE;",
        }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {an env property on a call result} => nothing, since the root is not an identifier', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({
        node: initializerOf({ source: "const load = () => ({ env: { MODE: 'x' } });\nconst subject = load().env.MODE;" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a call} => nothing, since it is not an access', () => {
      readEnvAccessLayerTransformerProxy();

      const result = readEnvAccessLayerTransformer({ node: initializerOf({ source: 'const subject = Number(process.env.MODE);' }) });

      expect(result).toBe(undefined);
    });
  });
});

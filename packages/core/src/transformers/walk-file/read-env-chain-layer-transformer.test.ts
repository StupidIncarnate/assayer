import { Project } from '#gateway/npm/ts-morph';
import type { Node } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readEnvChainLayerTransformer } from './read-env-chain-layer-transformer';
import { readEnvChainLayerTransformerProxy } from './read-env-chain-layer-transformer.proxy';

// The initializer of the file's `subject` const, parsed exactly as the walk parses: an in-memory
// project with the standard library and nothing else, so `process` resolves to no declaration.
const initializerOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);

  return sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow();
};

describe('readEnvChainLayerTransformer', () => {
  describe('the read itself', () => {
    it('VALID: {process.env.MODE} => the name with no steps', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({ node: initializerOf({ source: 'const subject = process.env.MODE;' }), seen: [] });

      expect(result).toStrictEqual({ root: { kind: 'env', name: 'MODE' }, steps: [] });
    });

    it("EMPTY: {process.env['']} => nothing, since an empty key names no variable", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({ node: initializerOf({ source: "const subject = process.env[''];" }), seen: [] });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.env itself} => nothing, since no variable is read', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({ node: initializerOf({ source: 'const subject = process.env;' }), seen: [] });

      expect(result).toBe(undefined);
    });
  });

  describe('steps in the order the code applies them', () => {
    it("VALID: {Number(process.env.N ?? '0') === 3} => default, number, equals", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = Number(process.env.N ?? '0') === 3;" }),
        seen: [],
      });

      expect(result).toStrictEqual({
        root: { kind: 'env', name: 'N' },
        steps: [{ kind: 'default', value: '0' }, { kind: 'number' }, { kind: 'equals', literal: 3, negated: false }],
      });
    });

    it("VALID: {process.env.FLAG == 'on'} => a loose equality reads as equals", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = process.env.FLAG == 'on';" }),
        seen: [],
      });

      expect(result).toStrictEqual({ root: { kind: 'env', name: 'FLAG' }, steps: [{ kind: 'equals', literal: 'on', negated: false }] });
    });

    it("VALID: {process.env.FLAG != 'on'} => a loose inequality reads as a negated equals", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = process.env.FLAG != 'on';" }),
        seen: [],
      });

      expect(result).toStrictEqual({ root: { kind: 'env', name: 'FLAG' }, steps: [{ kind: 'equals', literal: 'on', negated: true }] });
    });

    it("EMPTY: {split('')} => nothing, since an empty separator splits into characters", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = (process.env.P ?? '').split('');" }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a method that is not split or map} => nothing', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = (process.env.P ?? '').trim();" }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {Number() with no argument} => nothing', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({ node: initializerOf({ source: 'const subject = Number();' }), seen: [] });

      expect(result).toBe(undefined);
    });

    it('VALID: {a call whose callee is itself a call} => nothing', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: 'const make = () => Number;\nconst subject = make()(process.env.V);' }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a comparison with no literal on either side} => nothing', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: 'const subject = process.env.A === process.env.B;' }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });

    it("VALID: {a concatenation} => nothing, since it is not a step this reads", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = process.env.P + 'x';" }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a command-line read', () => {
    it('VALID: {Number(process.argv[2])} => the argv element with a number step', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({ node: initializerOf({ source: 'const subject = Number(process.argv[2]);' }), seen: [] });

      expect(result).toStrictEqual({ root: { kind: 'argv', shape: 'element', index: 2 }, steps: [{ kind: 'number' }] });
    });

    it("VALID: {process.argv[2] === 'yes'} => the argv element with an equals step", () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: "const subject = process.argv[2] === 'yes';" }),
        seen: [],
      });

      expect(result).toStrictEqual({
        root: { kind: 'argv', shape: 'element', index: 2 },
        steps: [{ kind: 'equals', literal: 'yes', negated: false }],
      });
    });

    it('VALID: {process.argv.slice(2).map(Number)} => the argv tail with a map step', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: 'const subject = process.argv.slice(2).map(Number);' }),
        seen: [],
      });

      expect(result).toStrictEqual({ root: { kind: 'argv', shape: 'tail', index: 2 }, steps: [{ kind: 'map' }] });
    });

    it('VALID: {process.argv[2] === undefined ? undefined : Number(process.argv[2])} => a guard, then number', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: 'const subject = process.argv[2] === undefined ? undefined : Number(process.argv[2]);' }),
        seen: [],
      });

      expect(result).toStrictEqual({ root: { kind: 'argv', shape: 'element', index: 2 }, steps: [{ kind: 'guard' }, { kind: 'number' }] });
    });

    it('VALID: {a guard on argv[2] over a chain on argv[3]} => nothing, since the guard tests another entry', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: 'const subject = process.argv[2] === undefined ? undefined : Number(process.argv[3]);' }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {Number(process.argv.slice(2))} => nothing, since Number reads a string', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({
        node: initializerOf({ source: 'const subject = Number(process.argv.slice(2));' }),
        seen: [],
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a binding in the chain', () => {
    it('VALID: {a declaration already followed} => nothing, so a cycle stops', () => {
      readEnvChainLayerTransformerProxy();

      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/x.ts', 'const raw = process.env.V;\nconst subject = raw;');

      const result = readEnvChainLayerTransformer({
        node: sourceFile.getVariableDeclarationOrThrow('subject').getInitializerOrThrow(),
        seen: [sourceFile.getVariableDeclarationOrThrow('raw')],
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {an identifier with no declaration} => nothing', () => {
      readEnvChainLayerTransformerProxy();

      const result = readEnvChainLayerTransformer({ node: initializerOf({ source: 'const subject = missing;' }), seen: [] });

      expect(result).toBe(undefined);
    });
  });
});

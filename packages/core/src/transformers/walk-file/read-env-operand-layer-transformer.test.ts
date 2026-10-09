import { Node, Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { readEnvOperandLayerTransformer } from './read-env-operand-layer-transformer';
import { readEnvOperandLayerTransformerProxy } from './read-env-operand-layer-transformer.proxy';

// The operand of the file's `if`, parsed exactly as the walk parses — an in-memory project with the
// standard library and NOTHING else, which is why `process` resolves to nothing and `Number`
// resolves to the lib. A `.length` access is read past, the way `read-condition` reads it.
const operandOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
  const sourceFile = project.createSourceFile('src/x.ts', source);
  const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
  const left = Node.isBinaryExpression(condition) ? condition.getLeft() : condition;

  return Node.isPropertyAccessExpression(left) && left.getName() === 'length' ? left.getExpression() : left;
};

describe('readEnvOperandLayerTransformer', () => {
  describe('a chain of steps it can run backwards', () => {
    it('VALID: {const value = Number(process.env.VALUE)} => the env var and one number step', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const value = Number(process.env.VALUE);\nif (value > 5) {} else {}' }),
      });

      expect(result).toStrictEqual({ name: 'VALUE', steps: [{ kind: 'number' }] });
    });

    it("VALID: {const value = process.env.VALUE === 'true'} => the env var and one equals step", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const value = process.env.VALUE === 'true';\nif (value) {} else {}" }),
      });

      expect(result).toStrictEqual({ name: 'VALUE', steps: [{ kind: 'equals', literal: 'true', negated: false }] });
    });

    it("VALID: {'off' !== process.env.MODE, literal on the left} => a negated equals step", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const on = 'off' !== process.env.MODE;\nif (on) {} else {}" }),
      });

      expect(result).toStrictEqual({ name: 'MODE', steps: [{ kind: 'equals', literal: 'off', negated: true }] });
    });

    it("VALID: {const text = process.env.TEXT ?? ''} => the env var and a default step", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const text = process.env.TEXT ?? '';\nif (text.length) {} else {}" }),
      });

      expect(result).toStrictEqual({ name: 'TEXT', steps: [{ kind: 'default', value: '' }] });
    });

    it("VALID: {(process.env.RECEIVER ?? '').split(',').map(Number)} => default, split and map, in order", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({
          source: "const receiver = (process.env.RECEIVER ?? '').split(',').map(Number);\nif (receiver.length > 5) {} else {}",
        }),
      });

      expect(result).toStrictEqual({
        name: 'RECEIVER',
        steps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }, { kind: 'map' }],
      });
    });

    it('VALID: {a map whose callback compares each item} => still a map step, since it keeps the length', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({
          source: "const flags = (process.env.FLAGS ?? '').split(',').map(item => item === 'true');\nif (flags.length) {} else {}",
        }),
      });

      expect(result).toStrictEqual({
        name: 'FLAGS',
        steps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }, { kind: 'map' }],
      });
    });

    it('VALID: {two hops through a second const} => the steps of both bindings, in order', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const raw = process.env.V;\nconst value = Number(raw);\nif (value > 5) {} else {}' }),
      });

      expect(result).toStrictEqual({ name: 'V', steps: [{ kind: 'number' }] });
    });

    it("VALID: {process.env['MODE'] with a literal key} => the same read as process.env.MODE", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const mode = process.env['MODE'];\nif (mode === 'big') {} else {}" }),
      });

      expect(result).toStrictEqual({ name: 'MODE', steps: [] });
    });

    it('VALID: {no step at all} => the env var with no steps, since the operand holds the raw string', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const mode = process.env.MODE;\nif (mode === 'big') {} else {}" }),
      });

      expect(result).toStrictEqual({ name: 'MODE', steps: [] });
    });

    it("VALID: {quotes, spacing and extra parentheses} => the same steps, since formatting is not read", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const receiver=((process.env.RECEIVER??"")).split(",");\nif (receiver.length) {} else {}' }),
      });

      expect(result).toStrictEqual({ name: 'RECEIVER', steps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }] });
    });
  });

  describe('an identifier the file declares itself is not the global', () => {
    // The impostor check. Both of these read `process.env.X` to the letter, and in neither does that
    // text mean the process environment — so setting a real variable would arrange nothing and the
    // case would fail against correct code. `export` makes each file a MODULE, which is what lets a
    // local legitimately shadow a global rather than be a redeclaration error.
    it('VALID: {a local `process`} => nothing, because this is not the runtime global', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({
          source:
            "export const q = 1;\nconst process = { env: { VALUE: '9' } };\n" +
            'const value = Number(process.env.VALUE);\nif (value > 5) {} else {}',
        }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a local `Number`} => nothing, because String is not its inverse', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({
          source:
            'export const q = 1;\nconst Number = (x: unknown): number => 9;\n' +
            'const value = Number(process.env.VALUE);\nif (value > 5) {} else {}',
        }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('a step it cannot run backwards', () => {
    // Each of these READS the environment, and each is declined, because recognizing the read is not
    // the point: inverting it is. Reporting "cannot drive" leaves the file undriven, which is honest;
    // guessing an inverse puts a failing case against correct code.
    it('VALID: {parseInt, whose radix makes it a different coercion} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const value = parseInt(process.env.V, 10);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it("VALID: {split with a limit} => nothing, since the limit caps the length", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const parts = (process.env.P ?? '').split(',', 2);\nif (parts.length > 1) {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {split on a non-literal separator} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({
          source: "const sep = String(1);\nconst parts = (process.env.P ?? '').split(sep);\nif (parts.length > 1) {} else {}",
        }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {map on a string} => nothing, since a string has no map', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const parts = (process.env.P ?? '').map(Number);\nif (parts.length) {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a filter, which changes the length} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const parts = (process.env.P ?? '').split(',').filter(Boolean);\nif (parts.length) {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it("VALID: {a fallback after a Number step} => nothing, since that fallback never runs", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const value = Number(process.env.V) ?? 3;\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a fallback that is not a string literal} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const value = process.env.V ?? 3;\nif (value) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {Number of a comparison} => nothing, since Number only inverts a string', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const value = Number(process.env.V === 'x');\nif (value) {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a comparison with undefined} => nothing, since undefined is not a value a case writes', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const set = process.env.V !== undefined;\nif (set) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a comparison with null} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const set = process.env.V != null;\nif (set) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a comparison of a split list} => nothing, since an array is not compared by value', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const same = (process.env.P ?? '').split(',') === 'a';\nif (same) {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a comparison operator that is not equality} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const big = process.env.V > 'm';\nif (big) {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a let binding, which could be reassigned} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'let value = Number(process.env.V);\nvalue = 3;\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it("VALID: {an `env` property on something that is not `process`} => nothing", () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({
          source: "export const q = 1;\nconst cfg = { env: { VALUE: '1' } };\nconst value = Number(cfg.env.VALUE);\nif (value > 5) {} else {}",
        }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.argv rather than process.env} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const value = Number(process.argv.VALUE);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.env with a computed key} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "const key = String(1);\nconst mode = process.env[key];\nif (mode === 'big') {} else {}" }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('operands that are not env reads at all', () => {
    // The hardcoded-const rung, which must keep answering nothing: `pure-statement.ts` depends on it.
    it('VALID: {a const welded to a literal} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({ node: operandOf({ source: 'const value = 7;\nif (value > 5) {} else {}' }) });

      expect(result).toBe(undefined);
    });

    // A param resolves to a ParameterDeclaration and stops — which is what leaves read-operand-type's
    // param rule untouched.
    it('VALID: {a function param} => nothing', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'export function f(value: number): string {\n  if (value > 5) { return "b"; }\n  return "s";\n}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a binding that refers to itself} => nothing, since the cycle stops', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: 'const a: number = b;\nconst b: number = a;\nif (a > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {an operand that is not an identifier} => nothing, even when it reads process.env in place', () => {
      readEnvOperandLayerTransformerProxy();

      const result = readEnvOperandLayerTransformer({
        node: operandOf({ source: "if (process.env.MODE === 'production') {} else {}" }),
      });

      expect(result).toBe(undefined);
    });
  });
});

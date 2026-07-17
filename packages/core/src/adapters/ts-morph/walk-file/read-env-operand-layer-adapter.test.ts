import { Node, Project, SyntaxKind } from 'ts-morph';

import { readEnvOperandLayerAdapter } from './read-env-operand-layer-adapter';
import { readEnvOperandLayerAdapterProxy } from './read-env-operand-layer-adapter.proxy';

// The operand of the file's `if`, parsed exactly as the walk parses — an in-memory project with the
// standard library and NOTHING else, which is why `process` resolves to nothing and `Number`
// resolves to the lib.
const operandOf = ({ source }: { source: string }): Node => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('src/x.ts', source);
  const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

  return Node.isBinaryExpression(condition) ? condition.getLeft() : condition;
};

describe('readEnvOperandLayerAdapter', () => {
  describe('the supported rung — one hop through Number()', () => {
    it('VALID: {const value = Number(process.env.VALUE)} => the env var the operand reads', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: 'const value = Number(process.env.VALUE);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe('VALUE');
    });
  });

  describe('an identifier the file declares itself is not the global', () => {
    // The impostor check. Both of these read `process.env.X` to the letter, and in neither does that
    // text mean the process environment — so setting a real variable would arrange nothing and the
    // case would fail against correct code. `export` makes each file a MODULE, which is what lets a
    // local legitimately shadow a global rather than be a redeclaration error.
    it('VALID: {a local `process`} => nothing, because this is not the runtime global', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({
          source:
            "export const q = 1;\nconst process = { env: { VALUE: '9' } };\n" +
            'const value = Number(process.env.VALUE);\nif (value > 5) {} else {}',
        }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {a local `Number`} => nothing, because String is not its inverse', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({
          source:
            'export const q = 1;\nconst Number = (x: unknown): number => 9;\n' +
            'const value = Number(process.env.VALUE);\nif (value > 5) {} else {}',
        }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('past the rung — honestly unrecognized rather than guessed', () => {
    // Each of these READS the environment, and each is declined, because recognizing the read is not
    // the point: inverting it is. Reporting "cannot drive" leaves the file undriven, which is honest;
    // guessing an inverse puts a failing case against correct code.
    it('VALID: {two hops through a second binding} => nothing, since the walk models no binding chain', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: 'const raw = process.env.V;\nconst value = Number(raw);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {parseInt, whose radix makes it a different coercion} => nothing', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: 'const value = parseInt(process.env.V, 10);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {no coercion at all} => nothing, since the analyzer loads no Node types to give it a domain', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: "const mode = process.env.MODE;\nif (mode === 'big') {} else {}" }),
      });

      expect(result).toBe(undefined);
    });

    it("VALID: {an `env` property on something that is not `process`} => nothing", () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({
          source: "export const q = 1;\nconst cfg = { env: { VALUE: '1' } };\nconst value = Number(cfg.env.VALUE);\nif (value > 5) {} else {}",
        }),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: {process.argv rather than process.env} => nothing', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: 'const value = Number(process.argv.VALUE);\nif (value > 5) {} else {}' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('operands that are not env reads at all', () => {
    // The hardcoded-const rung, which must keep answering nothing: `pure-statement.ts` depends on it.
    it('VALID: {a const welded to a literal} => nothing', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({ node: operandOf({ source: 'const value = 7;\nif (value > 5) {} else {}' }) });

      expect(result).toBe(undefined);
    });

    // A param resolves to a ParameterDeclaration and stops — which is what leaves read-operand-type's
    // param rule untouched.
    it('VALID: {a function param} => nothing', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: 'export function f(value: number): string {\n  if (value > 5) { return "b"; }\n  return "s";\n}' }),
      });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {an operand that is not an identifier} => nothing', () => {
      readEnvOperandLayerAdapterProxy();

      const result = readEnvOperandLayerAdapter({
        node: operandOf({ source: 'export function f(s: string): void {\n  if (s.length > 5) { console.log(1); }\n}' }),
      });

      expect(result).toBe(undefined);
    });
  });
});

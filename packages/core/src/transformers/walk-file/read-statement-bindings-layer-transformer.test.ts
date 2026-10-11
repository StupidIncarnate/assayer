import { Node, Project, SyntaxKind } from "#gateway/npm/ts-morph";
import { CompilerOptionsStub } from "#gateway/npm/typescript/compiler-options/compiler-options.stub";

import { WalkContextStub } from "../../contracts/walk-context/walk-context.stub";
import { readStatementBindingsLayerTransformer } from "./read-statement-bindings-layer-transformer";
import { readStatementBindingsLayerTransformerProxy } from "./read-statement-bindings-layer-transformer.proxy";

const CONTEXT = WalkContextStub({
  scopePath: ["f"],
  guardPath: [],
  params: [{ name: "n", type: { kind: "string" } }],
  exported: true,
  tail: true,
});

// The bindings in effect after every statement of function `f`'s body, each named by the variable it is for.
const bindingsAfter = ({
  source,
}: {
  source: string;
}): Record<string, unknown> => {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: CompilerOptionsStub(),
  });
  const sourceFile = project.createSourceFile("src/x.ts", source);
  const body = sourceFile.getFunctionOrThrow("f").getBodyOrThrow();
  const bindings = readStatementBindingsLayerTransformer({
    statements: Node.isBlock(body) ? body.getStatements() : [],
    bindings: {},
    context: CONTEXT,
  });
  const names = new Map(
    sourceFile
      .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
      .map(
        (declaration) =>
          [String(declaration.getPos()), declaration.getName()] as const,
      ),
  );

  return Object.fromEntries(
    Object.entries(bindings).map(([key, value]) => [
      names.get(key) ?? key,
      value,
    ]),
  );
};

describe("readStatementBindingsLayerTransformer", () => {
  describe("a declaration", () => {
    it("VALID: {let data = n} => data holds the parameter", () => {
      readStatementBindingsLayerTransformerProxy();

      expect(
        bindingsAfter({ source: "function f(n: string) { let data = n; }" }),
      ).toStrictEqual({ data: { kind: "param", name: "n" } });
    });

    it("EMPTY: {a declaration with no initializer} => nothing is tracked yet", () => {
      readStatementBindingsLayerTransformerProxy();

      expect(
        bindingsAfter({
          source: "function f(n: string) { let data: string; }",
        }),
      ).toStrictEqual({});
    });

    it("EMPTY: {an initializer that cannot be expressed} => nothing is tracked", () => {
      readStatementBindingsLayerTransformerProxy();

      expect(
        bindingsAfter({
          source:
            "declare function opaque(): string;\nfunction f(n: string) { let data = opaque(); }",
        }),
      ).toStrictEqual({});
    });
  });

  describe("an assignment", () => {
    it('VALID: {data = "b" after let data = n} => data holds the literal from then on', () => {
      readStatementBindingsLayerTransformerProxy();

      expect(
        bindingsAfter({
          source: "function f(n: string) { let data = n; data = 'b'; }",
        }),
      ).toStrictEqual({ data: { kind: "lit", value: "b" } });
    });

    it("VALID: {data = trim(data)} => the new value is built from the value data held before", () => {
      readStatementBindingsLayerTransformerProxy();
      const source =
        "const trim = (text: string): string => text.slice(1, -1);\nfunction f(n: string) { let data = n; data = trim(data); }";

      expect(bindingsAfter({ source })).toStrictEqual({
        data: {
          kind: "method",
          name: "slice",
          receiver: { kind: "param", name: "n" },
          args: [
            { kind: "lit", value: 1 },
            { kind: "lit", value: -1 },
          ],
        },
      });
    });
  });

  describe("an if", () => {
    it("VALID: {an arm that assigns} => afterward the variable is a select on that if`s branch", () => {
      readStatementBindingsLayerTransformerProxy();
      const source =
        "function f(n: string) { let data = n; if (n === 'None') data = 'on'; }";

      expect(bindingsAfter({ source })).toStrictEqual({
        data: {
          kind: "select",
          branch: "f/if:BinaryExpression,id:n,EqualsEqualsEqualsToken,str:None",
          then: { kind: "lit", value: "on" },
          else: { kind: "param", name: "n" },
        },
      });
    });

    it("VALID: {both arms assign the same value} => no select, the value is the same either way", () => {
      readStatementBindingsLayerTransformerProxy();
      const source =
        "function f(n: string) { let data = n; if (n === 'None') { data = 'x'; } else { data = 'x'; } }";

      expect(bindingsAfter({ source })).toStrictEqual({
        data: { kind: "lit", value: "x" },
      });
    });

    it("VALID: {the then arm returns} => what follows sees only the value the else path left", () => {
      readStatementBindingsLayerTransformerProxy();
      const source =
        "function f(n: string) { let data = n; if (n === 'None') { data = 'x'; return; } }";

      expect(bindingsAfter({ source })).toStrictEqual({
        data: { kind: "param", name: "n" },
      });
    });

    it("EMPTY: {an arm assigns something that cannot be expressed} => the variable is no longer tracked", () => {
      readStatementBindingsLayerTransformerProxy();
      const source =
        "declare function opaque(): string;\nfunction f(n: string) { let data = n; if (n === 'None') data = opaque(); }";

      expect(bindingsAfter({ source })).toStrictEqual({});
    });
  });

  describe("a variable some other statement writes", () => {
    it("EMPTY: {a write inside a loop} => never tracked, so no later read believes a stale value", () => {
      readStatementBindingsLayerTransformerProxy();
      const source =
        'function f(n: string) { let data = n; for (let i = 0; i < 2; i += 1) { data = "x"; } }';

      expect(bindingsAfter({ source })).toStrictEqual({});
    });
  });
});

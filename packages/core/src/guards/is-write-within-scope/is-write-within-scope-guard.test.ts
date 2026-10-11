import { Project, SyntaxKind } from "#gateway/npm/ts-morph";
import { CompilerOptionsStub } from "#gateway/npm/typescript/compiler-options/compiler-options.stub";

import { isWriteWithinScopeGuard } from "./is-write-within-scope-guard";

const functionOf = ({
  source,
}: {
  source: string;
}): ReturnType<ReturnType<Project["createSourceFile"]>["getFunctionOrThrow"]> =>
  new Project({
    useInMemoryFileSystem: true,
    compilerOptions: CompilerOptionsStub(),
  })
    .createSourceFile("src/x.ts", source)
    .getFunctionOrThrow("f");

describe("isWriteWithinScopeGuard", () => {
  it("VALID: {a statement in the function body block} => true", () => {
    const fn = functionOf({ source: "function f() { let a = 1; a = 2; }" });
    const [, write] = fn.getStatements();

    expect(
      isWriteWithinScopeGuard({ node: write?.getParent(), scope: fn }),
    ).toBe(true);
  });

  it("VALID: {a statement inside an if arm} => true", () => {
    const fn = functionOf({
      source: "function f(c: boolean) { let a = 1; if (c) { a = 2; } }",
    });
    const [, ifStatement] = fn.getStatements();
    const inner = ifStatement?.getFirstDescendantByKindOrThrow(
      SyntaxKind.ExpressionStatement,
    );

    expect(
      isWriteWithinScopeGuard({ node: inner?.getParent(), scope: fn }),
    ).toBe(true);
  });

  it("VALID: {a statement inside a for loop} => false", () => {
    const fn = functionOf({
      source: "function f() { let a = 1; for (;;) { a = 2; } }",
    });
    const [, loop] = fn.getStatements();
    const inner = loop?.getFirstDescendantByKindOrThrow(
      SyntaxKind.ExpressionStatement,
    );

    expect(
      isWriteWithinScopeGuard({ node: inner?.getParent(), scope: fn }),
    ).toBe(false);
  });

  it("EMPTY: {no node} => false", () => {
    expect(isWriteWithinScopeGuard({})).toBe(false);
  });
});

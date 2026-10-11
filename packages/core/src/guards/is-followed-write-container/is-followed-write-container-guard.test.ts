import { Project } from "#gateway/npm/ts-morph";
import { CompilerOptionsStub } from "#gateway/npm/typescript/compiler-options/compiler-options.stub";

import { isFollowedWriteContainerGuard } from "./is-followed-write-container-guard";

const sourceOf = ({
  source,
}: {
  source: string;
}): ReturnType<Project["createSourceFile"]> =>
  new Project({
    useInMemoryFileSystem: true,
    compilerOptions: CompilerOptionsStub(),
  }).createSourceFile("src/x.ts", source);

describe("isFollowedWriteContainerGuard", () => {
  it("VALID: {a block} => true", () => {
    const body = sourceOf({ source: "function f() { }" })
      .getFunctionOrThrow("f")
      .getBodyOrThrow();

    expect(isFollowedWriteContainerGuard({ node: body })).toBe(true);
  });

  it("VALID: {an if statement} => true", () => {
    const [statement] = sourceOf({
      source: "function f(c: boolean) { if (c) { } }",
    })
      .getFunctionOrThrow("f")
      .getStatements();

    expect(isFollowedWriteContainerGuard({ node: statement })).toBe(true);
  });

  it("VALID: {a for loop} => false", () => {
    const [statement] = sourceOf({ source: "function f() { for (;;) { } }" })
      .getFunctionOrThrow("f")
      .getStatements();

    expect(isFollowedWriteContainerGuard({ node: statement })).toBe(false);
  });

  it("EMPTY: {no node} => false", () => {
    expect(isFollowedWriteContainerGuard({})).toBe(false);
  });
});

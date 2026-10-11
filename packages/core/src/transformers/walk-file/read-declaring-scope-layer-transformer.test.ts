import { Project } from "#gateway/npm/ts-morph";
import { CompilerOptionsStub } from "#gateway/npm/typescript/compiler-options/compiler-options.stub";

import { readDeclaringScopeLayerTransformer } from "./read-declaring-scope-layer-transformer";
import { readDeclaringScopeLayerTransformerProxy } from "./read-declaring-scope-layer-transformer.proxy";

describe("readDeclaringScopeLayerTransformer", () => {
  it("VALID: {a statement inside a function} => the function", () => {
    readDeclaringScopeLayerTransformerProxy();
    const sourceFile = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub(),
    }).createSourceFile("src/x.ts", "function f() { let a = 1; }");
    const fn = sourceFile.getFunctionOrThrow("f");

    expect(
      readDeclaringScopeLayerTransformer({
        node: fn.getStatements()[0],
      }),
    ).toBe(fn);
  });

  it("VALID: {a module-level statement} => the source file", () => {
    readDeclaringScopeLayerTransformerProxy();
    const sourceFile = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: CompilerOptionsStub(),
    }).createSourceFile("src/x.ts", "let a = 1;");

    expect(
      readDeclaringScopeLayerTransformer({
        node: sourceFile.getStatements()[0],
      }),
    ).toBe(sourceFile);
  });

  it("EMPTY: {no node} => undefined", () => {
    readDeclaringScopeLayerTransformerProxy();

    expect(readDeclaringScopeLayerTransformer({ node: undefined })).toBe(
      undefined,
    );
  });
});

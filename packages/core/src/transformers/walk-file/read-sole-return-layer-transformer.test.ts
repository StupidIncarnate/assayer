import { Project } from "#gateway/npm/ts-morph";
import { CompilerOptionsStub } from "#gateway/npm/typescript/compiler-options/compiler-options.stub";

import { readSoleReturnLayerTransformer } from "./read-sole-return-layer-transformer";
import { readSoleReturnLayerTransformerProxy } from "./read-sole-return-layer-transformer.proxy";

const bodyOf = ({
  source,
}: {
  source: string;
}): ReturnType<
  ReturnType<Project["createSourceFile"]>["getFunctionOrThrow"]
>["getBody"] extends () => infer R
  ? R
  : never =>
  new Project({
    useInMemoryFileSystem: true,
    compilerOptions: CompilerOptionsStub(),
  })
    .createSourceFile("src/x.ts", source)
    .getFunctionOrThrow("f")
    .getBody();

describe("readSoleReturnLayerTransformer", () => {
  it("VALID: {a block holding one return} => the returned expression", () => {
    readSoleReturnLayerTransformerProxy();

    expect(
      readSoleReturnLayerTransformer({
        body: bodyOf({ source: "function f(n: string) { return n.trim(); }" }),
      })?.getText(),
    ).toBe("n.trim()");
  });

  it("EMPTY: {a block with two statements} => undefined", () => {
    readSoleReturnLayerTransformerProxy();

    expect(
      readSoleReturnLayerTransformer({
        body: bodyOf({
          source: "function f(n: string) { n.trim(); return n; }",
        }),
      }),
    ).toBe(undefined);
  });

  it("EMPTY: {no body} => undefined", () => {
    readSoleReturnLayerTransformerProxy();

    expect(readSoleReturnLayerTransformer({ body: undefined })).toBe(undefined);
  });
});

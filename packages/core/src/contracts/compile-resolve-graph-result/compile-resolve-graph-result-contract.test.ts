import { CompileResolveGraphResultStub } from "./compile-resolve-graph-result.stub";
import { compileResolveGraphResultContract } from "./compile-resolve-graph-result-contract";

describe("compileResolveGraphResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CompileResolveGraphResultStub();

      expect(compileResolveGraphResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {index: wrong type} => throws", () => {
      expect(() =>
        compileResolveGraphResultContract.parse({
          ...CompileResolveGraphResultStub(),
          index: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

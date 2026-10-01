import { CompileHarnessGraphResultStub } from "./compile-harness-graph-result.stub";
import { compileHarnessGraphResultContract } from "./compile-harness-graph-result-contract";

describe("compileHarnessGraphResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CompileHarnessGraphResultStub();

      expect(compileHarnessGraphResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {index: wrong type} => throws", () => {
      expect(() =>
        compileHarnessGraphResultContract.parse({
          ...CompileHarnessGraphResultStub(),
          index: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

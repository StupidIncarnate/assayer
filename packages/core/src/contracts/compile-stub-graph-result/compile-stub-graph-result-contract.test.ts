import { CompileStubGraphResultStub } from "./compile-stub-graph-result.stub";
import { compileStubGraphResultContract } from "./compile-stub-graph-result-contract";

describe("compileStubGraphResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CompileStubGraphResultStub();

      expect(compileStubGraphResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {index: wrong type} => throws", () => {
      expect(() =>
        compileStubGraphResultContract.parse({
          ...CompileStubGraphResultStub(),
          index: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

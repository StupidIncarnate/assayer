import { UseCompiledTreeResultStub } from "./use-compiled-tree-result.stub";
import { useCompiledTreeResultContract } from "./use-compiled-tree-result-contract";

describe("useCompiledTreeResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = UseCompiledTreeResultStub();

      expect(useCompiledTreeResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {data: wrong type} => throws", () => {
      expect(() =>
        useCompiledTreeResultContract.parse({
          ...UseCompiledTreeResultStub(),
          data: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

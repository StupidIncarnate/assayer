import { UseStubIndexResultStub } from "./use-stub-index-result.stub";
import { useStubIndexResultContract } from "./use-stub-index-result-contract";

describe("useStubIndexResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = UseStubIndexResultStub();

      expect(useStubIndexResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {data: wrong type} => throws", () => {
      expect(() =>
        useStubIndexResultContract.parse({
          ...UseStubIndexResultStub(),
          data: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

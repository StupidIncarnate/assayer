import { UseAssayerStatusResultStub } from "./use-assayer-status-result.stub";
import { useAssayerStatusResultContract } from "./use-assayer-status-result-contract";

describe("useAssayerStatusResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = UseAssayerStatusResultStub();

      expect(useAssayerStatusResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {data: wrong type} => throws", () => {
      expect(() =>
        useAssayerStatusResultContract.parse({
          ...UseAssayerStatusResultStub(),
          data: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

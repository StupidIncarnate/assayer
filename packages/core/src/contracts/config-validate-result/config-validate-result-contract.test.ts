import { ConfigValidateResultStub } from "./config-validate-result.stub";
import { configValidateResultContract } from "./config-validate-result-contract";

describe("configValidateResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ConfigValidateResultStub();

      expect(configValidateResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {success: wrong type} => throws", () => {
      expect(() =>
        configValidateResultContract.parse({
          ...ConfigValidateResultStub(),
          success: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

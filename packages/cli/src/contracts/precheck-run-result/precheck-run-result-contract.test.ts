import { PrecheckRunResultStub } from "./precheck-run-result.stub";
import { precheckRunResultContract } from "./precheck-run-result-contract";

describe("precheckRunResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = PrecheckRunResultStub();

      expect(precheckRunResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {configDir: wrong type} => throws", () => {
      expect(() =>
        precheckRunResultContract.parse({
          ...PrecheckRunResultStub(),
          configDir: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

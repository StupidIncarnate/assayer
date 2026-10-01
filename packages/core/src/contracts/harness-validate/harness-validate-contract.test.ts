import { HarnessValidateStub } from "./harness-validate.stub";
import { harnessValidateContract } from "./harness-validate-contract";

describe("harnessValidateContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = HarnessValidateStub();

      expect(harnessValidateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => harnessValidateContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

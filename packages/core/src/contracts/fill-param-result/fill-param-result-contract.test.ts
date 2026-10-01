import { FillParamResultStub } from "./fill-param-result.stub";
import { fillParamResultContract } from "./fill-param-result-contract";

describe("fillParamResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = FillParamResultStub();

      expect(fillParamResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {kind: wrong type} => throws", () => {
      expect(() =>
        fillParamResultContract.parse({ ...FillParamResultStub(), kind: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

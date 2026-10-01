import { HarnessClassifyResultStub } from "./harness-classify-result.stub";
import { harnessClassifyResultContract } from "./harness-classify-result-contract";

describe("harnessClassifyResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = HarnessClassifyResultStub();

      expect(harnessClassifyResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {targets: wrong type} => throws", () => {
      expect(() =>
        harnessClassifyResultContract.parse({
          ...HarnessClassifyResultStub(),
          targets: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

import { ThroughCallbackCasesStub } from "./through-callback-cases.stub";
import { throughCallbackCasesContract } from "./through-callback-cases-contract";

describe("throughCallbackCasesContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ThroughCallbackCasesStub();

      expect(throughCallbackCasesContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {analysis: wrong type} => throws", () => {
      expect(() =>
        throughCallbackCasesContract.parse({
          ...ThroughCallbackCasesStub(),
          analysis: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

import { FunnelCasesStub } from "./funnel-cases.stub";
import { funnelCasesContract } from "./funnel-cases-contract";

describe("funnelCasesContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = FunnelCasesStub();

      expect(funnelCasesContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {cases: wrong type} => throws", () => {
      expect(() =>
        funnelCasesContract.parse({ ...FunnelCasesStub(), cases: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

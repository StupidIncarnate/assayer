import { CompilePlanStableResultStub } from "./compile-plan-stable-result.stub";
import { compilePlanStableResultContract } from "./compile-plan-stable-result-contract";

describe("compilePlanStableResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CompilePlanStableResultStub();

      expect(compilePlanStableResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {mode: wrong type} => throws", () => {
      expect(() =>
        compilePlanStableResultContract.parse({
          ...CompilePlanStableResultStub(),
          mode: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

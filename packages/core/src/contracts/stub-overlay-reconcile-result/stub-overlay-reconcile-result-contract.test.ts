import { StubOverlayReconcileResultStub } from "./stub-overlay-reconcile-result.stub";
import { stubOverlayReconcileResultContract } from "./stub-overlay-reconcile-result-contract";

describe("stubOverlayReconcileResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = StubOverlayReconcileResultStub();

      expect(stubOverlayReconcileResultContract.parse(stub)).toStrictEqual(
        stub,
      );
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => stubOverlayReconcileResultContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

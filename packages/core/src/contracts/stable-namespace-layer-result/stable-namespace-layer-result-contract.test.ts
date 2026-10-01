import { StableNamespaceLayerResultStub } from "./stable-namespace-layer-result.stub";
import { stableNamespaceLayerResultContract } from "./stable-namespace-layer-result-contract";

describe("stableNamespaceLayerResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = StableNamespaceLayerResultStub();

      expect(stableNamespaceLayerResultContract.parse(stub)).toStrictEqual(
        stub,
      );
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {resultEntry: wrong type} => throws", () => {
      expect(() =>
        stableNamespaceLayerResultContract.parse({
          ...StableNamespaceLayerResultStub(),
          resultEntry: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

import { ConfigResolveLayerResultStub } from "./config-resolve-layer-result.stub";
import { configResolveLayerResultContract } from "./config-resolve-layer-result-contract";

describe("configResolveLayerResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ConfigResolveLayerResultStub();

      expect(configResolveLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {config: wrong type} => throws", () => {
      expect(() =>
        configResolveLayerResultContract.parse({
          ...ConfigResolveLayerResultStub(),
          config: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

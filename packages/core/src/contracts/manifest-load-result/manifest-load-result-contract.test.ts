import { ManifestLoadResultStub } from "./manifest-load-result.stub";
import { manifestLoadResultContract } from "./manifest-load-result-contract";

describe("manifestLoadResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ManifestLoadResultStub();

      expect(manifestLoadResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {status: wrong type} => throws", () => {
      expect(() =>
        manifestLoadResultContract.parse({
          ...ManifestLoadResultStub(),
          status: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

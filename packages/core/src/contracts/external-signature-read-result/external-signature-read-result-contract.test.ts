import { ExternalSignatureReadResultStub } from "./external-signature-read-result.stub";
import { externalSignatureReadResultContract } from "./external-signature-read-result-contract";

describe("externalSignatureReadResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ExternalSignatureReadResultStub();

      expect(externalSignatureReadResultContract.parse(stub)).toStrictEqual(
        stub,
      );
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {usable: wrong type} => throws", () => {
      expect(() =>
        externalSignatureReadResultContract.parse({
          ...ExternalSignatureReadResultStub(),
          usable: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

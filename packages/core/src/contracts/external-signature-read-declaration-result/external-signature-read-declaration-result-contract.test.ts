import { ExternalSignatureReadDeclarationResultStub } from "./external-signature-read-declaration-result.stub";
import { externalSignatureReadDeclarationResultContract } from "./external-signature-read-declaration-result-contract";

describe("externalSignatureReadDeclarationResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ExternalSignatureReadDeclarationResultStub();

      expect(
        externalSignatureReadDeclarationResultContract.parse(stub),
      ).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {usable: wrong type} => throws", () => {
      expect(() =>
        externalSignatureReadDeclarationResultContract.parse({
          ...ExternalSignatureReadDeclarationResultStub(),
          usable: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

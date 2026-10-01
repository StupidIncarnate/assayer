import { ImportSpecifierResolveResultStub } from "./import-specifier-resolve-result.stub";
import { importSpecifierResolveResultContract } from "./import-specifier-resolve-result-contract";

describe("importSpecifierResolveResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ImportSpecifierResolveResultStub();

      expect(importSpecifierResolveResultContract.parse(stub)).toStrictEqual(
        stub,
      );
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {resolved: wrong type} => throws", () => {
      expect(() =>
        importSpecifierResolveResultContract.parse({
          ...ImportSpecifierResolveResultStub(),
          resolved: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

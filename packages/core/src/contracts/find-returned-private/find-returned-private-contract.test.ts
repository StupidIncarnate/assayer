import { FindReturnedPrivateStub } from "./find-returned-private.stub";
import { findReturnedPrivateContract } from "./find-returned-private-contract";

describe("findReturnedPrivateContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = FindReturnedPrivateStub();

      expect(findReturnedPrivateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {privateScope: wrong type} => throws", () => {
      expect(() =>
        findReturnedPrivateContract.parse({
          ...FindReturnedPrivateStub(),
          privateScope: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

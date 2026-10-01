import { TypeofDomainStub } from "./typeof-domain.stub";
import { typeofDomainContract } from "./typeof-domain-contract";

describe("typeofDomainContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = TypeofDomainStub();

      expect(typeofDomainContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {members: wrong type} => throws", () => {
      expect(() =>
        typeofDomainContract.parse({ ...TypeofDomainStub(), members: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

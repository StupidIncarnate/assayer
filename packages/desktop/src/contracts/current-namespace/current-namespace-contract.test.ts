import { CurrentNamespaceStub } from "./current-namespace.stub";
import { currentNamespaceContract } from "./current-namespace-contract";

describe("currentNamespaceContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CurrentNamespaceStub();

      expect(currentNamespaceContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {namespaceName: wrong type} => throws", () => {
      expect(() =>
        currentNamespaceContract.parse({
          ...CurrentNamespaceStub(),
          namespaceName: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

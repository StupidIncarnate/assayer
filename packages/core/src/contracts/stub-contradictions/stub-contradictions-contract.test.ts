import { StubContradictionsStub } from "./stub-contradictions.stub";
import { stubContradictionsContract } from "./stub-contradictions-contract";

describe("stubContradictionsContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = StubContradictionsStub();

      expect(stubContradictionsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => stubContradictionsContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

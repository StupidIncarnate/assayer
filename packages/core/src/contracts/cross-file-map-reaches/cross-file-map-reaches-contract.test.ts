import { CrossFileMapReachesStub } from "./cross-file-map-reaches.stub";
import { crossFileMapReachesContract } from "./cross-file-map-reaches-contract";

describe("crossFileMapReachesContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CrossFileMapReachesStub();

      expect(crossFileMapReachesContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => crossFileMapReachesContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

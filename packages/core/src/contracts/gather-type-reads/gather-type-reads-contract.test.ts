import { GatherTypeReadsStub } from "./gather-type-reads.stub";
import { gatherTypeReadsContract } from "./gather-type-reads-contract";

describe("gatherTypeReadsContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = GatherTypeReadsStub();

      expect(gatherTypeReadsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => gatherTypeReadsContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

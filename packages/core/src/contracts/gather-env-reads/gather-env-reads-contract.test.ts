import { GatherEnvReadsStub } from "./gather-env-reads.stub";
import { gatherEnvReadsContract } from "./gather-env-reads-contract";

describe("gatherEnvReadsContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = GatherEnvReadsStub();

      expect(gatherEnvReadsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => gatherEnvReadsContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

import { CauseArrangeStub } from "./cause-arrange.stub";
import { causeArrangeContract } from "./cause-arrange-contract";

describe("causeArrangeContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = CauseArrangeStub();

      expect(causeArrangeContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {unreachable: wrong type} => throws", () => {
      expect(() =>
        causeArrangeContract.parse({
          ...CauseArrangeStub(),
          unreachable: "nope",
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

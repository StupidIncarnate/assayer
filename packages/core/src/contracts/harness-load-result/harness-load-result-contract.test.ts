import { HarnessLoadResultStub } from "./harness-load-result.stub";
import { harnessLoadResultContract } from "./harness-load-result-contract";

describe("harnessLoadResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = HarnessLoadResultStub();

      expect(harnessLoadResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {ok: wrong type} => throws", () => {
      expect(() =>
        harnessLoadResultContract.parse({
          ...HarnessLoadResultStub(),
          ok: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

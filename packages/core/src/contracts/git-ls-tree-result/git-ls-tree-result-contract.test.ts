import { GitLsTreeResultStub } from "./git-ls-tree-result.stub";
import { gitLsTreeResultContract } from "./git-ls-tree-result-contract";

describe("gitLsTreeResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = GitLsTreeResultStub();

      expect(gitLsTreeResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => gitLsTreeResultContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

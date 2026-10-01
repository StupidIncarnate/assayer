import { GitDetectStableBranchResultStub } from "./git-detect-stable-branch-result.stub";
import { gitDetectStableBranchResultContract } from "./git-detect-stable-branch-result-contract";

describe("gitDetectStableBranchResultContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = GitDetectStableBranchResultStub();

      expect(gitDetectStableBranchResultContract.parse(stub)).toStrictEqual(
        stub,
      );
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {hasGitRepo: wrong type} => throws", () => {
      expect(() =>
        gitDetectStableBranchResultContract.parse({
          ...GitDetectStableBranchResultStub(),
          hasGitRepo: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

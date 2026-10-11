import { BranchNodeStub } from "@assayer/shared/contracts/branch-node/branch-node.stub";
import { GuardStepStub } from "@assayer/shared/contracts/guard-step/guard-step.stub";

import { isBranchMetGuard } from "./is-branch-met-guard";

const NESTED = BranchNodeStub({
  coverageId: "f/if:inner",
  guardPath: [GuardStepStub({ branchCoverageId: "f/if:outer", arm: "then" })],
});

describe("isBranchMetGuard", () => {
  it("VALID: {a branch with no guard path} => true", () => {
    expect(
      isBranchMetGuard({
        branch: BranchNodeStub({ guardPath: [] }),
        taken: [],
        knownIds: new Set(),
      }),
    ).toBe(true);
  });

  it("VALID: {the route took the arm the branch is nested in} => true", () => {
    const taken = [
      GuardStepStub({ branchCoverageId: "f/if:outer", arm: "then" }),
    ];

    expect(
      isBranchMetGuard({
        branch: NESTED,
        taken,
        knownIds: new Set(["f/if:outer"]),
      }),
    ).toBe(true);
  });

  it("VALID: {the route took the other arm} => false", () => {
    const taken = [
      GuardStepStub({ branchCoverageId: "f/if:outer", arm: "else" }),
    ];

    expect(
      isBranchMetGuard({
        branch: NESTED,
        taken,
        knownIds: new Set(["f/if:outer"]),
      }),
    ).toBe(false);
  });

  it("VALID: {the route never reached the enclosing branch} => false", () => {
    expect(
      isBranchMetGuard({
        branch: NESTED,
        taken: [],
        knownIds: new Set(["f/if:outer"]),
      }),
    ).toBe(false);
  });

  it("VALID: {the guard step names a branch the entry does not own} => true", () => {
    expect(
      isBranchMetGuard({ branch: NESTED, taken: [], knownIds: new Set() }),
    ).toBe(true);
  });

  it("EMPTY: {no branch} => false", () => {
    expect(isBranchMetGuard({ taken: [], knownIds: new Set() })).toBe(false);
  });
});

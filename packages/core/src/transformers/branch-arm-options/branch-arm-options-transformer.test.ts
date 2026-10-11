import { BranchNodeStub } from "@assayer/shared/contracts/branch-node/branch-node.stub";

import { branchArmOptionsTransformer } from "./branch-arm-options-transformer";

const A_BRANCH = BranchNodeStub({
  coverageId: "f/if:a",
  condition: {
    kind: "leaf",
    id: "f/if:a#leaf",
    operandParamName: "a",
    operandType: { kind: "number" },
    predicate: { kind: "gt", literal: 5 },
  },
});

describe("branchArmOptionsTransformer", () => {
  it("VALID: {a steerable leaf branch} => a then option wanting true and an else option wanting false", () => {
    expect(
      branchArmOptionsTransformer({ branch: A_BRANCH, unsteerable: new Set() }),
    ).toStrictEqual([
      {
        requirements: [{ leaf: A_BRANCH.condition, want: true }],
        arms: [{ branchCoverageId: "f/if:a", arm: "then" }],
      },
      {
        requirements: [{ leaf: A_BRANCH.condition, want: false }],
        arms: [{ branchCoverageId: "f/if:a", arm: "else" }],
      },
    ]);
  });

  it("VALID: {an unsteerable branch} => both arms with no requirement", () => {
    expect(
      branchArmOptionsTransformer({
        branch: A_BRANCH,
        unsteerable: new Set(["f/if:a"]),
      }),
    ).toStrictEqual([
      { requirements: [], arms: [{ branchCoverageId: "f/if:a", arm: "then" }] },
      { requirements: [], arms: [{ branchCoverageId: "f/if:a", arm: "else" }] },
    ]);
  });
});

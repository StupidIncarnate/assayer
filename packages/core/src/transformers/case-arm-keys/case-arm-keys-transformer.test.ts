import { DerivedTestCaseStub } from "@assayer/shared/contracts/derived-test-case/derived-test-case.stub";
import { GuardStepStub } from "@assayer/shared/contracts/guard-step/guard-step.stub";

import { caseArmKeysTransformer } from "./case-arm-keys-transformer";

describe("caseArmKeysTransformer", () => {
  it("VALID: {a case taking two arms, one repeated} => one key per distinct arm in order", () => {
    const testCase = DerivedTestCaseStub({
      arms: [
        GuardStepStub({ branchCoverageId: "f/if:a", arm: "then" }),
        GuardStepStub({ branchCoverageId: "f/if:b", arm: "else" }),
        GuardStepStub({ branchCoverageId: "f/if:a", arm: "then" }),
      ],
    });

    expect(caseArmKeysTransformer({ testCase })).toStrictEqual([
      "f/if:a|then",
      "f/if:b|else",
    ]);
  });

  it("EMPTY: {a case with no arms} => no keys", () => {
    expect(
      caseArmKeysTransformer({ testCase: DerivedTestCaseStub({ arms: [] }) }),
    ).toStrictEqual([]);
  });
});

import { DerivedTestCaseStub } from "@assayer/shared/contracts/derived-test-case/derived-test-case.stub";

import { fewestRunsTransformer } from "./fewest-runs-transformer";

const arm = (
  branch: string,
  side: string,
): { branchCoverageId: string; arm: string } => ({
  branchCoverageId: branch,
  arm: side,
});
const route = (
  arms: { branchCoverageId: string; arm: string }[],
  extra: { driven?: boolean } = {},
): ReturnType<typeof DerivedTestCaseStub> =>
  DerivedTestCaseStub({ arms: arms as never, ...extra, fewestRuns: false });

describe("fewestRunsTransformer", () => {
  describe("arm cover", () => {
    it("VALID: {the worked example routes} => cases 1, 2 and 5 are the fewest runs", () => {
      const cases = [
        route([
          arm("len", "then"),
          arm("none", "then"),
          arm("no", "else"),
          arm("on", "then"),
        ]),
        route([
          arm("len", "then"),
          arm("none", "else"),
          arm("no", "then"),
          arm("on", "else"),
        ]),
        route([
          arm("len", "then"),
          arm("none", "else"),
          arm("no", "else"),
          arm("on", "then"),
        ]),
        route([
          arm("len", "then"),
          arm("none", "else"),
          arm("no", "else"),
          arm("on", "else"),
        ]),
        route([
          arm("len", "else"),
          arm("none", "else"),
          arm("no", "else"),
          arm("on", "then"),
        ]),
      ];

      const result = fewestRunsTransformer({ cases });

      expect(result.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        true,
        false,
        false,
        true,
      ]);
    });

    it("VALID: {two covers of one size} => the earliest case covering the earliest arm wins, every time", () => {
      const cases = [
        route([arm("a", "then"), arm("b", "then")]),
        route([arm("a", "else"), arm("b", "else")]),
        route([arm("a", "then"), arm("b", "else")]),
        route([arm("a", "else"), arm("b", "then")]),
      ];

      const first = fewestRunsTransformer({ cases });
      const second = fewestRunsTransformer({ cases: first });

      expect(first.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        true,
        false,
        false,
      ]);
      expect(second.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        true,
        false,
        false,
      ]);
    });

    it("VALID: {a side-effect-only if} => both of its two routes run", () => {
      const cases = [
        route([arm("flag", "then")]),
        route([arm("flag", "else")]),
      ];

      const result = fewestRunsTransformer({ cases });

      expect(result.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        true,
      ]);
    });
  });

  describe("undriven routes", () => {
    it("VALID: {an undriven route takes an arm no driven one does} => it is in the set but never replaces a driven cover", () => {
      const cases = [
        route([arm("a", "then")]),
        route([arm("a", "else")]),
        route([arm("a", "then"), arm("opaque", "then")], { driven: false }),
        route([arm("a", "else"), arm("opaque", "else")], { driven: false }),
      ];

      const result = fewestRunsTransformer({ cases });

      expect(result.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        true,
        true,
        true,
      ]);
    });

    it("VALID: {an undriven route repeats arms a driven one takes} => it stays out of the fewest-runs set", () => {
      const cases = [
        route([arm("a", "then")]),
        route([arm("a", "else")]),
        route([arm("a", "then")], { driven: false }),
      ];

      const result = fewestRunsTransformer({ cases });

      expect(result.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        true,
        false,
      ]);
    });
  });

  describe("no arms", () => {
    it("VALID: {branchless cases} => the first driven case is the one run", () => {
      const cases = [route([]), route([])];

      const result = fewestRunsTransformer({ cases });

      expect(result.map((testCase) => testCase.fewestRuns)).toStrictEqual([
        true,
        false,
      ]);
    });

    it("EMPTY: {no cases} => no cases", () => {
      expect(fewestRunsTransformer({ cases: [] })).toStrictEqual([]);
    });
  });
});

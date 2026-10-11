import { exactArmCoverTransformer } from "./exact-arm-cover-transformer";

describe("exactArmCoverTransformer", () => {
  it("VALID: {one case takes every arm, limit 1} => that case", () => {
    const keys = [["a|then"], ["a|then", "a|else"]];

    expect(
      exactArmCoverTransformer({
        keys,
        candidates: [0, 1],
        uncovered: ["a|then", "a|else"],
        chosen: [],
        limit: 1,
      }),
    ).toStrictEqual([1]);
  });

  it("VALID: {two cases are needed, limit 2} => the earliest case for each first uncovered arm", () => {
    const keys = [["a|then"], ["a|else"]];

    expect(
      exactArmCoverTransformer({
        keys,
        candidates: [0, 1],
        uncovered: ["a|then", "a|else"],
        chosen: [],
        limit: 2,
      }),
    ).toStrictEqual([0, 1]);
  });

  it("EMPTY: {the limit is too small} => undefined", () => {
    const keys = [["a|then"], ["a|else"]];

    expect(
      exactArmCoverTransformer({
        keys,
        candidates: [0, 1],
        uncovered: ["a|then", "a|else"],
        chosen: [],
        limit: 1,
      }),
    ).toBe(undefined);
  });

  it("EMPTY: {nothing uncovered} => the chosen cases unchanged", () => {
    expect(
      exactArmCoverTransformer({
        keys: [],
        candidates: [],
        uncovered: [],
        chosen: [],
        limit: 0,
      }),
    ).toStrictEqual([]);
  });
});

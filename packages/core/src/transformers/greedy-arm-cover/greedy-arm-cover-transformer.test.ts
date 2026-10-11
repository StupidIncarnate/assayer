import { greedyArmCoverTransformer } from "./greedy-arm-cover-transformer";

describe("greedyArmCoverTransformer", () => {
  it("VALID: {one case takes most arms} => that case first, then the case for what is left", () => {
    const keys = [["a|then"], ["a|else", "b|then", "c|then"], ["b|else"]];

    expect(
      greedyArmCoverTransformer({
        keys,
        candidates: [0, 1, 2],
        uncovered: ["a|then", "a|else", "b|then", "b|else", "c|then"],
      }),
    ).toStrictEqual([1, 0, 2]);
  });

  it("VALID: {two cases tie on gain} => the earliest case wins", () => {
    expect(
      greedyArmCoverTransformer({
        keys: [["a|then"], ["a|then"]],
        candidates: [0, 1],
        uncovered: ["a|then"],
      }),
    ).toStrictEqual([0]);
  });

  it("EMPTY: {nothing uncovered} => no cases", () => {
    expect(
      greedyArmCoverTransformer({
        keys: [["a|then"]],
        candidates: [0],
        uncovered: [],
      }),
    ).toStrictEqual([]);
  });

  it("EMPTY: {no candidate takes the arm} => no cases", () => {
    expect(
      greedyArmCoverTransformer({
        keys: [["a|then"]],
        candidates: [0],
        uncovered: ["z|else"],
      }),
    ).toStrictEqual([]);
  });
});

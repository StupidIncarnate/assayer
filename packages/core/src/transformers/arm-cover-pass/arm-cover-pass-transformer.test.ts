import { armCoverPassTransformer } from "./arm-cover-pass-transformer";

describe("armCoverPassTransformer", () => {
  it("VALID: {one case takes every arm another takes} => only that case", () => {
    expect(
      armCoverPassTransformer({
        keys: [["a|then"], ["a|then", "a|else"]],
        candidates: [0, 1],
      }),
    ).toStrictEqual([1]);
  });

  it("VALID: {two cases take the same arms} => the earliest stands for both", () => {
    expect(
      armCoverPassTransformer({
        keys: [["a|then"], ["a|then"]],
        candidates: [0, 1],
      }),
    ).toStrictEqual([0]);
  });

  it("VALID: {more distinct candidates than the exact limit} => the greedy cover, still taking every arm", () => {
    const keys = Array.from({ length: 30 }, (_value, index) => [
      `a${String(index)}|then`,
    ]);

    expect(
      armCoverPassTransformer({
        keys,
        candidates: keys.map((_key, index) => index),
      }),
    ).toStrictEqual(keys.map((_key, index) => index));
  });

  it("EMPTY: {no candidates} => no cases", () => {
    expect(armCoverPassTransformer({ keys: [], candidates: [] })).toStrictEqual(
      [],
    );
  });
});

import { isArmTakenGuard } from "./is-arm-taken-guard";

describe("isArmTakenGuard", () => {
  it("VALID: {the case lists the arm} => true", () => {
    expect(
      isArmTakenGuard({ caseKeys: ["a|then", "b|else"], target: "b|else" }),
    ).toBe(true);
  });

  it("VALID: {the case does not list the arm} => false", () => {
    expect(isArmTakenGuard({ caseKeys: ["a|then"], target: "a|else" })).toBe(
      false,
    );
  });

  it("EMPTY: {no case keys} => false", () => {
    expect(isArmTakenGuard({ target: "a|then" })).toBe(false);
  });

  it("EMPTY: {no target} => false", () => {
    expect(isArmTakenGuard({ caseKeys: ["a|then"] })).toBe(false);
  });
});

import { ArrangeBindingStub } from "@assayer/shared/contracts/arrange-binding/arrange-binding.stub";
import { ConditionLeafStub } from "@assayer/shared/contracts/condition-leaf/condition-leaf.stub";
import { ValueExprStub } from "@assayer/shared/contracts/value-expr/value-expr.stub";

import { derivedGuardWitnessesTransformer } from "./derived-guard-witnesses-transformer";

const TRIMMED = ValueExprStub({
  kind: "method",
  name: "trim",
  receiver: { kind: "param", name: "n" },
  args: [],
});
const LEAF = ConditionLeafStub({
  id: "f/if:a#leaf",
  operandParamName: "data",
  operandType: { kind: "string" },
  predicate: { kind: "eq", literal: "x" },
});
const PADDED = [
  ArrangeBindingStub({ kind: "param", param: "n", value: " x " }),
];
const OTHER = [ArrangeBindingStub({ kind: "param", param: "n", value: "y" })];

describe("derivedGuardWitnessesTransformer", () => {
  it("VALID: {a trimmed value that equals the literal} => only the arrangement that meets the guard", () => {
    expect(
      derivedGuardWitnessesTransformer({
        derived: [{ leaf: LEAF, want: true, expr: TRIMMED }],
        arrangements: [OTHER, PADDED],
      }),
    ).toStrictEqual([PADDED]);
  });

  it("VALID: {the guard wants false} => the arrangement that does not meet it", () => {
    expect(
      derivedGuardWitnessesTransformer({
        derived: [{ leaf: LEAF, want: false, expr: TRIMMED }],
        arrangements: [OTHER, PADDED],
      }),
    ).toStrictEqual([OTHER]);
  });

  it("EMPTY: {the arrangement leaves the parameter unset} => no witness", () => {
    expect(
      derivedGuardWitnessesTransformer({
        derived: [{ leaf: LEAF, want: true, expr: TRIMMED }],
        arrangements: [[]],
      }),
    ).toStrictEqual([]);
  });

  it("EMPTY: {no derived guard} => every arrangement", () => {
    expect(
      derivedGuardWitnessesTransformer({ derived: [], arrangements: [OTHER] }),
    ).toStrictEqual([OTHER]);
  });
});

import { ValueDomainStub } from "../../contracts/value-domain/value-domain.stub";

import { lengthComparisonLayerTransformer } from "./length-comparison-layer-transformer";

describe("lengthComparisonLayerTransformer", () => {
  it("VALID: {length-eq 3} => satisfying pins the length, violating excludes it", () => {
    expect(
      lengthComparisonLayerTransformer({
        predicateKind: "length-eq",
        bound: 3,
      }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ lengthMin: 3, lengthMax: 3 }),
      violating: ValueDomainStub({ lengthExcluded: [3] }),
    });
  });

  it("VALID: {length-neq 3} => the mirror of length-eq", () => {
    expect(
      lengthComparisonLayerTransformer({
        predicateKind: "length-neq",
        bound: 3,
      }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ lengthExcluded: [3] }),
      violating: ValueDomainStub({ lengthMin: 3, lengthMax: 3 }),
    });
  });

  it("VALID: {length-gt 3} => a minimum above 3, a maximum of 3", () => {
    expect(
      lengthComparisonLayerTransformer({
        predicateKind: "length-gt",
        bound: 3,
      }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ lengthMin: 3, lengthMinExclusive: true }),
      violating: ValueDomainStub({ lengthMax: 3 }),
    });
  });

  it("VALID: {length-gte 3} => a minimum of 3, a maximum below 3", () => {
    expect(
      lengthComparisonLayerTransformer({
        predicateKind: "length-gte",
        bound: 3,
      }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ lengthMin: 3 }),
      violating: ValueDomainStub({ lengthMax: 3, lengthMaxExclusive: true }),
    });
  });

  it("VALID: {length-lt 3} => a maximum below 3, a minimum of 3", () => {
    expect(
      lengthComparisonLayerTransformer({
        predicateKind: "length-lt",
        bound: 3,
      }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ lengthMax: 3, lengthMaxExclusive: true }),
      violating: ValueDomainStub({ lengthMin: 3 }),
    });
  });

  it("VALID: {length-lte 3} => a maximum of 3, a minimum above 3", () => {
    expect(
      lengthComparisonLayerTransformer({
        predicateKind: "length-lte",
        bound: 3,
      }),
    ).toStrictEqual({
      satisfying: ValueDomainStub({ lengthMax: 3 }),
      violating: ValueDomainStub({ lengthMin: 3, lengthMinExclusive: true }),
    });
  });

  it("EMPTY: {a kind that is not a length comparison} => both arms unconstrained", () => {
    expect(
      lengthComparisonLayerTransformer({ predicateKind: "eq", bound: 3 }),
    ).toStrictEqual({
      satisfying: ValueDomainStub(),
      violating: ValueDomainStub(),
    });
  });
});

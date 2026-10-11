import { ValueExprStub } from "@assayer/shared/contracts/value-expr/value-expr.stub";

import { joinArmBindingsLayerTransformer } from "./join-arm-bindings-layer-transformer";
import { joinArmBindingsLayerTransformerProxy } from "./join-arm-bindings-layer-transformer.proxy";

const ONE = ValueExprStub({ kind: "lit", value: 1 });
const TWO = ValueExprStub({ kind: "lit", value: 2 });

describe("joinArmBindingsLayerTransformer", () => {
  it("VALID: {both arms fall through with different values} => a select on the branch", () => {
    joinArmBindingsLayerTransformerProxy();

    expect(
      joinArmBindingsLayerTransformer({
        before: { before: ONE },
        thenBindings: { a: ONE },
        elseBindings: { a: TWO },
        thenExits: false,
        elseExits: false,
        branch: "f/if:x",
      }),
    ).toStrictEqual({
      a: ValueExprStub({
        kind: "select",
        branch: "f/if:x",
        then: ONE,
        else: TWO,
      }),
    });
  });

  it("VALID: {both arms leave the same value} => that value, not a select", () => {
    joinArmBindingsLayerTransformerProxy();

    expect(
      joinArmBindingsLayerTransformer({
        before: { before: ONE },
        thenBindings: { a: ONE },
        elseBindings: { a: ONE },
        thenExits: false,
        elseExits: false,
        branch: "f/if:x",
      }),
    ).toStrictEqual({ a: ONE });
  });

  it("VALID: {a variable only one arm tracks} => dropped", () => {
    joinArmBindingsLayerTransformerProxy();

    expect(
      joinArmBindingsLayerTransformer({
        before: { before: ONE },
        thenBindings: { a: ONE },
        elseBindings: {},
        thenExits: false,
        elseExits: false,
        branch: "f/if:x",
      }),
    ).toStrictEqual({});
  });

  it("VALID: {the then arm always exits} => the else arm bindings", () => {
    joinArmBindingsLayerTransformerProxy();

    expect(
      joinArmBindingsLayerTransformer({
        before: { before: ONE },
        thenBindings: {},
        elseBindings: { a: TWO },
        thenExits: true,
        elseExits: false,
        branch: "f/if:x",
      }),
    ).toStrictEqual({ a: TWO });
  });

  it("VALID: {the else arm always exits} => the then arm bindings", () => {
    joinArmBindingsLayerTransformerProxy();

    expect(
      joinArmBindingsLayerTransformer({
        before: { before: ONE },
        thenBindings: { a: ONE },
        elseBindings: {},
        thenExits: false,
        elseExits: true,
        branch: "f/if:x",
      }),
    ).toStrictEqual({ a: ONE });
  });

  it("VALID: {both arms exit} => the bindings before the if", () => {
    joinArmBindingsLayerTransformerProxy();

    expect(
      joinArmBindingsLayerTransformer({
        before: { before: ONE },
        thenBindings: {},
        elseBindings: {},
        thenExits: true,
        elseExits: true,
        branch: "f/if:x",
      }),
    ).toStrictEqual({ before: ONE });
  });
});

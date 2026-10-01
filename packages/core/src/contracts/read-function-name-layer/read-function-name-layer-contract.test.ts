import { ReadFunctionNameLayerStub } from "./read-function-name-layer.stub";
import { readFunctionNameLayerContract } from "./read-function-name-layer-contract";

describe("readFunctionNameLayerContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = ReadFunctionNameLayerStub();

      expect(readFunctionNameLayerContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {name: wrong type} => throws", () => {
      expect(() =>
        readFunctionNameLayerContract.parse({
          ...ReadFunctionNameLayerStub(),
          name: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});

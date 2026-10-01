import { InputBucketsStub } from "./input-buckets.stub";
import { inputBucketsContract } from "./input-buckets-contract";

describe("inputBucketsContract", () => {
  describe("valid inputs", () => {
    it("VALID: {stub} => parses successfully", () => {
      const stub = InputBucketsStub();

      expect(inputBucketsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe("invalid inputs", () => {
    it("INVALID: {value: wrong type} => throws", () => {
      expect(() => inputBucketsContract.parse(123)).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});

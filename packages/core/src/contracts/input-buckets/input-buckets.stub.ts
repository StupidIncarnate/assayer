/**
 * PURPOSE: Builds a valid InputBuckets for tests
 *
 * USAGE:
 * InputBucketsStub();
 * // Returns a valid InputBuckets
 */

import { inputBucketsContract } from "./input-buckets-contract";
import type { InputBuckets } from "./input-buckets-contract";

export const InputBucketsStub = (): InputBuckets =>
  inputBucketsContract.parse([]);

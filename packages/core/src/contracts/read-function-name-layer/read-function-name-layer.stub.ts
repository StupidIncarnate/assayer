/**
 * PURPOSE: Builds a valid ReadFunctionNameLayer for tests
 *
 * USAGE:
 * ReadFunctionNameLayerStub();
 * // Returns a valid ReadFunctionNameLayer
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";

import { readFunctionNameLayerContract } from "./read-function-name-layer-contract";
import type { ReadFunctionNameLayer } from "./read-function-name-layer-contract";

export const ReadFunctionNameLayerStub = ({
  ...props
}: StubArgument<ReadFunctionNameLayer> = {}): ReadFunctionNameLayer =>
  readFunctionNameLayerContract.parse({
    name: "sample",
    anonymous: false,
    ...props,
  });

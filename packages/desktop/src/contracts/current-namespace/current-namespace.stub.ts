/**
 * PURPOSE: Builds a valid CurrentNamespace for tests
 *
 * USAGE:
 * CurrentNamespaceStub();
 * // Returns a valid CurrentNamespace
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";

import { currentNamespaceContract } from "./current-namespace-contract";
import type { CurrentNamespace } from "./current-namespace-contract";

export const CurrentNamespaceStub = ({
  ...props
}: StubArgument<CurrentNamespace> = {}): CurrentNamespace =>
  currentNamespaceContract.parse({
    namespaceName: "sample",
    files: [],
    ...props,
  });

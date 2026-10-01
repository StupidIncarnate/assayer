/**
 * PURPOSE: Builds a valid UseStubIndexResult for tests
 *
 * USAGE:
 * UseStubIndexResultStub();
 * // Returns a valid UseStubIndexResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { StubViewStub } from "@assayer/shared/contracts/stub-view/stub-view.stub";

import { useStubIndexResultContract } from "./use-stub-index-result-contract";
import type { UseStubIndexResult } from "./use-stub-index-result-contract";

export const UseStubIndexResultStub = ({
  ...props
}: StubArgument<UseStubIndexResult> = {}): UseStubIndexResult =>
  useStubIndexResultContract.parse({
    data: StubViewStub(),
    loading: false,
    error: new Error("sample"),
    ...props,
  });
